import os, sys, re, datetime, json
from PIL import Image, ImageOps

src_dir = r'C:\Users\bling\Desktop\相册'
dst_dir = r'd:\tools\IdeaProjects\wechat-ai-wingman\romantic-gallery\assets\photos'
out_js = r'd:\tools\IdeaProjects\wechat-ai-wingman\romantic-gallery\js\photos-data.js'

os.makedirs(dst_dir, exist_ok=True)

files = [f for f in os.listdir(src_dir) if f.lower().endswith('.jpg')]
month_groups = {}

for f in files:
    m1 = re.search(r'20\d{2}[-_]?\d{2}[-_]?\d{2}', f)
    m2 = re.search(r'(\d{13})', f)
    date_str = None
    if m1:
        raw = re.sub(r'[-_]', '', m1.group(0))
        date_str = f'{raw[:4]}-{raw[4:6]}-{raw[6:8]}'
    elif m2:
        ts = int(m2.group(1)) / 1000.0
        dt = datetime.datetime.fromtimestamp(ts)
        date_str = dt.strftime('%Y-%m-%d')
    else:
        mtime = os.path.getmtime(os.path.join(src_dir, f))
        dt = datetime.datetime.fromtimestamp(mtime)
        date_str = dt.strftime('%Y-%m-%d')
    
    month_key = date_str[:7]
    month_groups.setdefault(month_key, []).append({'src_file': f, 'date': date_str})

MONTH_TITLES = {
    '2022-02': '初春萌芽・心动的序幕',
    '2022-03': '微风与你・三月的春光',
    '2022-05': '初夏盛开・晴朗的约定',
    '2022-06': '热夏蝉鸣・并肩的时光',
    '2022-07': '盛夏晚风・海边的汽水',
    '2022-08': '八月初秋・晚霞与落日',
    '2022-09': '金秋拾光・温柔的相伴',
    '2022-12': '冬月初雪・手心的温度',
    '2023-01': '新年烟火・关于你的愿望',
    '2023-02': '早春暖阳・浪漫的重逢',
    '2023-04': '四月芳菲・人间的诗意',
    '2023-05': '相恋周年・深情的告白',
    '2023-06': '夏日出游・灿烂的笑颜',
    '2023-08': '星河长明・相伴的惬意',
    '2023-09': '秋意渐浓・生活的甜味',
    '2023-10': '金秋十月・携手的漫步',
    '2023-11': '闪光碎片・无数个可爱瞬间',
    '2024-02': '又是一年・爱意依旧浓烈',
    '2024-04': '春暖花开・故事仍在继续'
}

MONTH_DESCS = {
    '2022-02': '故事从这里悄悄开始，第一眼的悸动，变成了往后所有的心甘情愿。',
    '2022-03': '春水初生，春林初盛，春风十里不如你。',
    '2022-05': '阳光穿透树叶的斑驳，落在你干净好看的笑脸上。',
    '2022-06': '夏天是属于汽水、西瓜，以及和你漫步的每一条林荫小道。',
    '2022-07': '海风吹拂起发梢，那一刻我许愿时光能走得再慢一点。',
    '2022-08': '晚霞把天空染成了橘粉色，和你在一起，连黄昏都变得温柔。',
    '2022-09': '秋天的风吹落了树叶，却吹不散你眼里的光。',
    '2022-12': '雪落人间，天地苍茫，两只揣在同一个口袋里的手，暖透了整个冬天。',
    '2023-01': '跨年夜的烟火升空，身旁是你，所有关于未来的期许都有了名字。',
    '2023-02': '冬去春来，喜欢你这件事，已经变成了如呼吸般自然的事。',
    '2023-04': '走过每一个盛开的花丛，用相机替我们记住最好的青春。',
    '2023-05': '不知不觉走过了四季，感谢你的出现，让平淡的日子闪闪发光。',
    '2023-06': '去吹山顶的风，去看海边的浪，去探索未知的世界。',
    '2023-08': '即使不说话，只是静静并肩坐着，心里也是满当当的踏实与安宁。',
    '2023-09': '人间烟火气，最抚凡人心，浪漫就是每天和你一起吃热腾腾的饭。',
    '2023-10': '十月的风微凉，有你在身边，心里永远温暖如春。',
    '2023-11': '定格你每一个搞怪又可爱的瞬间，做我镜头里唯一且永远的女主角。',
    '2024-02': '又是一年新春，时光在变，但爱意在时光里愈发沉淀与坚定。',
    '2024-04': '未完待续的诗篇，未完待续的爱恋，未来请继续多多指教。'
}

selected_photos = []
sample_idx = 1

for m in sorted(month_groups.keys()):
    items = month_groups[m]
    items.sort(key=lambda x: (x['date'], x['src_file']))
    
    # Cap 2023-11 bursts so gallery remains performant
    if len(items) > 40:
        step = len(items) // 30
        sampled = items[::step][:32]
    else:
        sampled = items
        
    m_title = MONTH_TITLES.get(m, f'{m} 甜蜜回忆')
    m_desc = MONTH_DESCS.get(m, '每一张照片，都是时间写给我们的浪漫情书。')

    for it in sampled:
        clean_m = m.replace('-', '')
        dst_name = f'photo_{sample_idx:03d}_{clean_m}.jpg'
        selected_photos.append({
            'id': sample_idx,
            'month': m,
            'date': it['date'],
            'src_path': os.path.join(src_dir, it['src_file']),
            'dst_name': dst_name,
            'url': f'assets/photos/{dst_name}',
            'title': m_title,
            'desc': m_desc
        })
        sample_idx += 1

print(f'Ready to process {len(selected_photos)} photos...')

# Process and resize images with EXIF orientation fix
for i, item in enumerate(selected_photos):
    dst_full = os.path.join(dst_dir, item['dst_name'])
    if not os.path.exists(dst_full):
        try:
            with Image.open(item['src_path']) as img:
                img = ImageOps.exif_transpose(img)
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                img.save(dst_full, 'JPEG', quality=82, optimize=True)
        except Exception as e:
            print(f'Error processing {item["src_path"]}: {e}')
    if (i + 1) % 40 == 0 or (i + 1) == len(selected_photos):
        print(f'Processed {i + 1}/{len(selected_photos)}...')

print('All photos processed successfully!')

# Prepare manifest grouped by month
months_summary = []
for m in sorted(set(p['month'] for p in selected_photos)):
    m_photos = [p for p in selected_photos if p['month'] == m]
    months_summary.append({
        'month': m,
        'title': MONTH_TITLES.get(m, f'{m} 回忆'),
        'desc': MONTH_DESCS.get(m, ''),
        'count': len(m_photos),
        'cover': m_photos[0]['url']
    })

# Clean data for JS export
clean_photos = [{
    'id': p['id'],
    'month': p['month'],
    'date': p['date'],
    'url': p['url'],
    'title': p['title'],
    'desc': p['desc']
} for p in selected_photos]

js_content = f'''/**
 * EternalEcho - Real Couple Photo Dataset
 * Grouped by Month from 2022 to 2024
 */
window.REAL_COUPLE_PHOTOS = {json.dumps(clean_photos, ensure_ascii=False, indent=2)};
window.REAL_MONTHS_SUMMARY = {json.dumps(months_summary, ensure_ascii=False, indent=2)};
'''

with open(out_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f'Manifest written to {out_js}!')
