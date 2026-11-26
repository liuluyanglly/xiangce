# -*- coding: utf-8 -*-
"""
====================================================================
  Windows 真实桌面图标控制脚本：桌面蹦迪 · 桌面打台球 · 图标跳舞 · 鸡你太美
  Zero-Dependency (纯 Python 标准库 ctypes + winsound + tkinter)
====================================================================
"""

import ctypes
from ctypes import wintypes
import math
import time
import threading
import atexit
import signal
import sys
import tkinter as tk
from tkinter import ttk

# ------------------------------------------------------------------
# 1. Windows API 与桌面句柄定位
# ------------------------------------------------------------------
user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

LVM_FIRST = 0x1000
LVM_GETITEMCOUNT = LVM_FIRST + 4
LVM_SETITEMPOSITION = LVM_FIRST + 15
LVM_GETITEMPOSITION = LVM_FIRST + 16

PROCESS_VM_OPERATION = 0x0008
PROCESS_VM_READ = 0x0010
PROCESS_VM_WRITE = 0x0020

class POINT(ctypes.Structure):
    _fields_ = [('x', ctypes.c_long), ('y', ctypes.c_long)]

def setup_desktop_environment():
    """确保线程进入 Default 桌面，兼容不同的会话环境"""
    try:
        h_def = user32.OpenDesktopW("Default", 0, False, 0x01FF)
        if h_def:
            user32.SetThreadDesktop(h_def)
    except Exception as e:
        print("[DesktopEnv] Note:", e)

def get_desktop_listview():
    """获取 Windows 桌面 SysListView32 的窗口句柄"""
    setup_desktop_environment()
    progman = user32.FindWindowW("Progman", None)
    defview = user32.FindWindowExW(progman, 0, "SHELLDLL_DefView", None)
    if defview:
        lv = user32.FindWindowExW(defview, 0, "SysListView32", None)
        if lv:
            return lv

    # 兼容某些 Windows 10/11 系统的 WorkerW 壁纸结构
    target_lv = []
    def enum_cb(hwnd, lparam):
        dv = user32.FindWindowExW(hwnd, 0, "SHELLDLL_DefView", None)
        if dv:
            l = user32.FindWindowExW(dv, 0, "SysListView32", None)
            if l:
                target_lv.append(l)
                return False
        return True

    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows.argtypes = [WNDENUMPROC, wintypes.LPARAM]
    user32.EnumWindows.restype = wintypes.BOOL
    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
    return target_lv[0] if target_lv else None

# ------------------------------------------------------------------
# 2. 真实桌面图标控制器 (Icon Manager)
# ------------------------------------------------------------------
class DesktopIconManager:
    def __init__(self):
        self.lv = get_desktop_listview()
        if not self.lv:
            raise RuntimeError("无法定位 Windows 桌面图标 SysListView32 句柄！")

        self.count = user32.SendMessageW(self.lv, LVM_GETITEMCOUNT, 0, 0)
        print(f"[桌面初始化] 成功捕获真实桌面！当前共有 {self.count} 个桌面图标。")

        self.screen_width = user32.GetSystemMetrics(0)
        self.screen_height = user32.GetSystemMetrics(1)

        # 备份真实原始坐标 (安全保底)
        self.original_positions = {}
        self.backup_original_positions()

        # 物理/动画粒子状态列表
        self.items = []
        self.init_item_states()

    def backup_original_positions(self):
        """跨进程安全读取并备份所有图标的真实原始坐标"""
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(self.lv, ctypes.byref(pid))
        h_process = kernel32.OpenProcess(
            PROCESS_VM_OPERATION | PROCESS_VM_READ | PROCESS_VM_WRITE,
            False, pid.value
        )
        if not h_process:
            print("[警告] 无法跨进程获取 Explorer 句柄，使用估算网格备份。")
            for i in range(self.count):
                self.original_positions[i] = (20 + (i // 10) * 90, 20 + (i % 10) * 90)
            return

        kernel32.VirtualAllocEx.restype = ctypes.c_void_p
        kernel32.VirtualAllocEx.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, wintypes.DWORD, wintypes.DWORD]
        remote_mem = kernel32.VirtualAllocEx(h_process, None, 16, 0x1000, 0x04)

        for i in range(self.count):
            user32.SendMessageW(self.lv, LVM_GETITEMPOSITION, i, remote_mem)
            pt = POINT()
            read_bytes = ctypes.c_size_t()
            kernel32.ReadProcessMemory(
                h_process, ctypes.c_void_p(remote_mem),
                ctypes.byref(pt), ctypes.sizeof(pt), ctypes.byref(read_bytes)
            )
            self.original_positions[i] = (pt.x, pt.y)

        kernel32.VirtualFreeEx(h_process, ctypes.c_void_p(remote_mem), 0, 0x8000)
        kernel32.CloseHandle(h_process)
        print(f"[安全备份] 已成功完整备份 {len(self.original_positions)} 个桌面图标的原始位置！")

    def init_item_states(self):
        self.items = []
        for i in range(self.count):
            orig_x, orig_y = self.original_positions.get(i, (100, 100))
            self.items.append({
                'id': i,
                'x': float(orig_x),
                'y': float(orig_y),
                'orig_x': float(orig_x),
                'orig_y': float(orig_y),
                'vx': 0.0,
                'vy': 0.0,
                'radius': 32.0,
                'mass': 1.0,
                'is_pocketed': False
            })

    def set_icon_pos(self, idx, x, y):
        """将指定索引的图标设置到屏幕 (x, y) 坐标"""
        x_clamped = max(0, min(int(x), self.screen_width - 40))
        y_clamped = max(0, min(int(y), self.screen_height - 60))
        lparam = (y_clamped << 16) | (x_clamped & 0xFFFF)
        user32.SendMessageW(self.lv, LVM_SETITEMPOSITION, idx, lparam)

    def restore_all(self):
        """一键瞬移还原所有图标到原始坐标"""
        print("\n[桌面还原] 正在将所有图标还原到初始位置...")
        for i in range(self.count):
            if i in self.original_positions:
                ox, oy = self.original_positions[i]
                self.set_icon_pos(i, ox, oy)
                if i < len(self.items):
                    self.items[i]['x'] = float(ox)
                    self.items[i]['y'] = float(oy)
                    self.items[i]['vx'] = 0.0
                    self.items[i]['vy'] = 0.0
                    self.items[i]['is_pocketed'] = False
        print("[桌面还原] 还原完成！工作区整洁如初。")

# ------------------------------------------------------------------
# 3. 蜂鸣音效合成 (纯内置 winsound)
# ------------------------------------------------------------------
class SynthAudio:
    @staticmethod
    def play_cue_hit():
        threading.Thread(target=lambda: SynthAudio._beep(180, 50), daemon=True).start()

    @staticmethod
    def play_ball_hit():
        threading.Thread(target=lambda: SynthAudio._beep(1200, 25), daemon=True).start()

    @staticmethod
    def play_pocket():
        threading.Thread(target=lambda: SynthAudio._beep(450, 90), daemon=True).start()

    @staticmethod
    def play_ikun_jntm():
        """演奏'只因你太美'经典旋律 (6 1 2 3 5 3 2 1)"""
        def _melody():
            notes = [
                (440, 180), (523, 180), (587, 180), (659, 220),
                (784, 280), (659, 180), (587, 180), (523, 300)
            ]
            for freq, dur in notes:
                SynthAudio._beep(freq, dur)
                time.sleep(0.04)
        threading.Thread(target=_melody, daemon=True).start()

    @staticmethod
    def _beep(freq, duration):
        try:
            import winsound
            winsound.Beep(int(freq), int(duration))
        except Exception:
            pass

# ------------------------------------------------------------------
# 4. 模式引擎：台球物理 · 蹦迪狂欢 · 鸡你太美 · 跳舞波浪
# ------------------------------------------------------------------
class FunEngine:
    def __init__(self, manager: DesktopIconManager):
        self.mgr = manager
        self.mode = 'idle' # idle | disco | pool | ikun | dance
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def set_mode(self, mode_name):
        self.mode = mode_name
        print(f"[模式切换] 当前模式 -> {mode_name}")
        if mode_name == 'pool':
            self.rack_pool_balls()
        elif mode_name == 'ikun':
            SynthAudio.play_ikun_jntm()

    def rack_pool_balls(self):
        """摆放美式台球三角形球阵"""
        sw = self.mgr.screen_width
        sh = self.mgr.screen_height
        apex_x = sw * 0.35
        apex_y = sh * 0.48
        r = 38.0
        dx = r * 1.732
        dy = r * 1.05

        ball_idx = 1
        for row in range(5):
            for col in range(row + 1):
                if ball_idx < len(self.mgr.items):
                    x = apex_x - row * dx
                    y = apex_y + (col - row / 2.0) * (dy * 2)
                    item = self.mgr.items[ball_idx]
                    item['x'] = x
                    item['y'] = y
                    item['vx'] = 0.0
                    item['vy'] = 0.0
                    item['is_pocketed'] = False
                    self.mgr.set_icon_pos(ball_idx, x, y)
                    ball_idx += 1

        # 母球（0 号白球）放在开球区
        if len(self.mgr.items) > 0:
            cue = self.mgr.items[0]
            cue['x'] = sw * 0.72
            cue['y'] = sh * 0.48
            cue['vx'] = 0.0
            cue['vy'] = 0.0
            cue['is_pocketed'] = False
            self.mgr.set_icon_pos(0, cue['x'], cue['y'])

    def shoot_cue_ball(self, power=38.0, angle=math.pi):
        """母球击打发球"""
        if len(self.mgr.items) == 0:
            return
        cue = self.mgr.items[0]
        cue['vx'] = math.cos(angle) * power
        cue['vy'] = math.sin(angle) * (power * 0.5)
        SynthAudio.play_cue_hit()
        print(f"[台球] 轰出一杆！力度={power:.1f}")

    def _loop(self):
        tick = 0
        while self.running:
            tick += 1
            if self.mode == 'disco':
                self._update_disco(tick)
                time.sleep(0.04)
            elif self.mode == 'pool':
                self._update_pool()
                time.sleep(0.025)
            elif self.mode == 'dance':
                self._update_dance(tick)
                time.sleep(0.04)
            elif self.mode == 'ikun':
                self._update_ikun(tick)
                time.sleep(0.05)
            else:
                time.sleep(0.1)

    # ---------------- 模式 1：桌面蹦迪 (Disco) ----------------
    def _update_disco(self, tick):
        sw = self.mgr.screen_width
        sh = self.mgr.screen_height
        cx, cy = sw * 0.5, sh * 0.45
        t = tick * 0.12

        # 结合旋转涡流与低音炮心跳炸裂
        bass_pulse = math.sin(t * 1.5) ** 4
        base_radius = 220 + bass_pulse * 120

        for i, item in enumerate(self.mgr.items):
            angle = (i / len(self.mgr.items)) * math.pi * 2 + t * 0.8
            wave_mod = math.sin(t * 2.5 + i * 0.5) * 60
            r = base_radius + wave_mod + (i % 3) * 45
            x = cx + math.cos(angle) * r * 1.4
            y = cy + math.sin(angle) * r
            self.mgr.set_icon_pos(i, x, y)

    # ---------------- 模式 2：桌面打台球物理引擎 (Pool) ----------------
    def _update_pool(self):
        items = self.mgr.items
        sw = self.mgr.screen_width
        sh = self.mgr.screen_height
        pad = 40
        friction = 0.985

        # 6 个球袋坐标
        pockets = [
            (pad, pad), (sw // 2, pad), (sw - pad, pad),
            (pad, sh - pad), (sw // 2, sh - pad), (sw - pad, sh - pad)
        ]

        # 1. 移动与边界反弹
        for item in items:
            if item['is_pocketed']:
                continue

            item['x'] += item['vx']
            item['y'] += item['vy']
            item['vx'] *= friction
            item['vy'] *= friction

            if abs(item['vx']) < 0.05: item['vx'] = 0.0
            if abs(item['vy']) < 0.05: item['vy'] = 0.0

            # 屏幕边缘反弹
            if item['x'] - item['radius'] < pad:
                item['x'] = pad + item['radius']
                item['vx'] = -item['vx'] * 0.85
                SynthAudio.play_ball_hit()
            elif item['x'] + item['radius'] > sw - pad:
                item['x'] = sw - pad - item['radius']
                item['vx'] = -item['vx'] * 0.85
                SynthAudio.play_ball_hit()

            if item['y'] - item['radius'] < pad:
                item['y'] = pad + item['radius']
                item['vy'] = -item['vy'] * 0.85
                SynthAudio.play_ball_hit()
            elif item['y'] + item['radius'] > sh - pad - 40:
                item['y'] = sh - pad - 40 - item['radius']
                item['vy'] = -item['vy'] * 0.85
                SynthAudio.play_ball_hit()

            # 球袋落袋判定
            for px, py in pockets:
                dist = math.hypot(item['x'] - px, item['y'] - py)
                if dist < 48:
                    item['is_pocketed'] = True
                    item['vx'] = 0
                    item['vy'] = 0
                    SynthAudio.play_pocket()
                    # 移动到球袋外侧排开
                    self.mgr.set_icon_pos(item['id'], px, py)
                    break
            else:
                self.mgr.set_icon_pos(item['id'], item['x'], item['y'])

        # 2. 图标刚体两两弹性碰撞检测 (动量守恒)
        n = len(items)
        for i in range(n):
            for j in range(i + 1, n):
                b1 = items[i]
                b2 = items[j]
                if b1['is_pocketed'] or b2['is_pocketed']:
                    continue

                dx = b2['x'] - b1['x']
                dy = b2['y'] - b1['y']
                dist = math.hypot(dx, dy)
                min_dist = b1['radius'] + b2['radius']

                if 0 < dist < min_dist:
                    # 反穿透推开
                    overlap = min_dist - dist
                    nx = dx / dist
                    ny = dy / dist
                    b1['x'] -= nx * overlap * 0.5
                    b1['y'] -= ny * overlap * 0.5
                    b2['x'] += nx * overlap * 0.5
                    b2['y'] += ny * overlap * 0.5

                    # 完全弹性碰撞速度交换
                    kx = b1['vx'] - b2['vx']
                    ky = b1['vy'] - b2['vy']
                    p = (nx * kx + ny * ky)
                    b1['vx'] -= p * nx
                    b1['vy'] -= p * ny
                    b2['vx'] += p * nx
                    b2['vy'] += p * ny

                    if abs(p) > 1.2:
                        SynthAudio.play_ball_hit()

    # ---------------- 模式 3：鸡你太美专属排舞 (Ikün) ----------------
    def _update_ikun(self, tick):
        sw = self.mgr.screen_width
        sh = self.mgr.screen_height
        cx, cy = sw * 0.5, sh * 0.45
        t = tick * 0.15

        # 铁山靠经典左右抖肩与颠球动作
        shoulder_shake = math.sin(t * 3) * 35
        bounce_y = abs(math.sin(t * 2)) * 30

        # 排列成象征坤坤篮球与翅膀的弧线阵型
        for i, item in enumerate(self.mgr.items):
            # 将图标分成头、身躯、双臂翅膀与篮球四组
            ratio = i / len(self.mgr.items)
            angle = ratio * math.pi * 2
            # 篮球心跳弧线
            r = 180 + math.sin(angle * 3 + t) * 40
            x = cx + math.cos(angle) * r * 1.5 + shoulder_shake
            y = cy + math.sin(angle) * r - bounce_y
            self.mgr.set_icon_pos(i, x, y)

    # ---------------- 模式 4：图标波浪舞 (Dance) ----------------
    def _update_dance(self, tick):
        t = tick * 0.1
        for i, item in enumerate(self.mgr.items):
            ox = item['orig_x']
            oy = item['orig_y']
            # 从左至右的涟漪波浪
            wave_y = math.sin(t + ox * 0.015) * 45
            wave_x = math.cos(t * 0.8 + oy * 0.015) * 20
            self.mgr.set_icon_pos(i, ox + wave_x, oy + wave_y)

# ------------------------------------------------------------------
# 5. 置顶悬浮迷你控制台 UI (Tkinter)
# ------------------------------------------------------------------
class FloatingControlPanel:
    def __init__(self, engine: FunEngine):
        self.engine = engine
        self.root = tk.Tk()
        self.root.title("桌面图标控制中心")
        self.root.geometry("340x260+40+40")
        self.root.attributes("-topmost", True)
        self.root.attributes("-alpha", 0.94)
        self.root.configure(bg="#0f172a")

        self.setup_ui()
        self.bind_keys()

    def setup_ui(self):
        style = ttk.Style()
        style.theme_use('clam')

        title = tk.Label(
            self.root, text="🪩 桌面蹦迪 & 台球控制台",
            font=("Microsoft YaHei", 12, "bold"), fg="#f8fafc", bg="#0f172a"
        )
        title.pack(pady=8)

        # 模式切换按钮组
        btn_frame = tk.Frame(self.root, bg="#0f172a")
        btn_frame.pack(fill='both', expand=True, padx=14)

        b1 = tk.Button(
            btn_frame, text="🪩 桌面蹦迪 (按 1)", font=("Microsoft YaHei", 10, "bold"),
            bg="#be123c", fg="#fff", activebackground="#f43f5e", activeforeground="#fff",
            command=lambda: self.engine.set_mode('disco'), relief="flat", cursor="hand2"
        )
        b1.grid(row=0, column=0, padx=4, pady=4, sticky='nsew')

        b2 = tk.Button(
            btn_frame, text="🎱 桌面打台球 (按 2)", font=("Microsoft YaHei", 10, "bold"),
            bg="#047857", fg="#fff", activebackground="#10b981", activeforeground="#fff",
            command=lambda: self.engine.set_mode('pool'), relief="flat", cursor="hand2"
        )
        b2.grid(row=0, column=1, padx=4, pady=4, sticky='nsew')

        b3 = tk.Button(
            btn_frame, text="🐔 鸡你太美 (按 3)", font=("Microsoft YaHei", 10, "bold"),
            bg="#b45309", fg="#fff", activebackground="#f59e0b", activeforeground="#fff",
            command=lambda: self.engine.set_mode('ikun'), relief="flat", cursor="hand2"
        )
        b3.grid(row=1, column=0, padx=4, pady=4, sticky='nsew')

        b4 = tk.Button(
            btn_frame, text="💃 图标波浪舞 (按 4)", font=("Microsoft YaHei", 10, "bold"),
            bg="#6366f1", fg="#fff", activebackground="#818cf8", activeforeground="#fff",
            command=lambda: self.engine.set_mode('dance'), relief="flat", cursor="hand2"
        )
        b4.grid(row=1, column=1, padx=4, pady=4, sticky='nsew')

        btn_frame.grid_columnconfigure(0, weight=1)
        btn_frame.grid_columnconfigure(1, weight=1)

        # 台球发射按钮
        shoot_btn = tk.Button(
            self.root, text="⚡ 台球击球发射 (空格键 Space)", font=("Microsoft YaHei", 10),
            bg="#334155", fg="#facc15", activebackground="#475569", activeforeground="#fef08a",
            command=lambda: self.engine.shoot_cue_ball(power=38.0), relief="flat", cursor="hand2"
        )
        shoot_btn.pack(fill='x', padx=18, pady=4)

        # 底部还原与退出
        bottom_frame = tk.Frame(self.root, bg="#0f172a")
        bottom_frame.pack(fill='x', padx=18, pady=6)

        restore_btn = tk.Button(
            bottom_frame, text="↺ 还原桌面 (R)", font=("Microsoft YaHei", 9),
            bg="#1e293b", fg="#94a3b8", command=self.restore, relief="flat"
        )
        restore_btn.pack(side='left', fill='x', expand=True, padx=2)

        exit_btn = tk.Button(
            bottom_frame, text="✕ 退出脚本 (ESC)", font=("Microsoft YaHei", 9),
            bg="#1e293b", fg="#f87171", command=self.on_close, relief="flat"
        )
        exit_btn.pack(side='right', fill='x', expand=True, padx=2)

        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def bind_keys(self):
        self.root.bind("<space>", lambda e: self.engine.shoot_cue_ball())
        self.root.bind("1", lambda e: self.engine.set_mode('disco'))
        self.root.bind("2", lambda e: self.engine.set_mode('pool'))
        self.root.bind("3", lambda e: self.engine.set_mode('ikun'))
        self.root.bind("4", lambda e: self.engine.set_mode('dance'))
        self.root.bind("r", lambda e: self.restore())
        self.root.bind("R", lambda e: self.restore())
        self.root.bind("<Escape>", lambda e: self.on_close())

    def restore(self):
        self.engine.mode = 'idle'
        self.engine.mgr.restore_all()

    def on_close(self):
        print("\n[退出中] 正在执行全量安全还原...")
        self.engine.running = False
        self.engine.mgr.restore_all()
        self.root.destroy()
        sys.exit(0)

# ------------------------------------------------------------------
# 6. 主程序入口与安全注册
# ------------------------------------------------------------------
def main():
    print("=" * 60)
    print("   🌟 Windows 真实桌面图标控制系统 🌟")
    print("   模式支持：桌面蹦迪 | 桌面打台球 | 鸡你太美 | 图标跳舞")
    print("=" * 60)

    try:
        manager = DesktopIconManager()
    except Exception as e:
        print("[致命错误] 无法初始化桌面图标管理器:", e)
        return

    # 注册退出钩子，确保强制退出时也能还原桌面
    atexit.register(manager.restore_all)
    signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))

    engine = FunEngine(manager)
    print("\n[Ready] 控制台已就绪，正在弹出置顶浮动控制面板...")
    app = FloatingControlPanel(engine)
    app.root.mainloop()

if __name__ == '__main__':
    main()
