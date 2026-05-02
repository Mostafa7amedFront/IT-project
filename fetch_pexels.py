import urllib.request
import re
import json

queries = {
    'p1': 'laptop',
    'p2': 'headphones',
    'p3': 'smartwatch',
    'p4': 'running sneakers',
    'p5': 'macbook',
    'p6': 'mirrorless camera',
    'p7': 'tablet',
    'p8': 'camera lens',
    'p9': 'gaming console',
    'p10': 'earbuds',
    'p11': 'gaming desktop',
    'p12': 'mechanical keyboard',
    'p13': 'smart home hub',
    'p14': 'monitor',
    'p15': 'action camera',
    'p16': 'bluetooth speaker',
    'p17': 'fitness tracker',
    'p18': 'gaming mouse',
    'p19': 'power bank',
    'p20': 'ssd drive',
    'p21': 'drone',
    'p22': 'vr headset',
    'p23': 'mechanical watch',
    'p24': 'kindle e-reader',
    'p25': 'espresso machine',
    'p26': 'robot vacuum',
    'p27': 'electric scooter'
}

replacements = {}

for pid, q in queries.items():
    url = 'https://www.pexels.com/search/' + urllib.parse.quote(q) + '/'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            # Extract image URLs matching images.pexels.com/photos/...
            matches = re.findall(r'(https://images\.pexels\.com/photos/\d+/pexels-photo-\d+\.jpeg\?auto=compress&amp;cs=tinysrgb&amp;w=\d+)', html)
            if matches:
                # Replace amp; and fix width to 600
                img_url = matches[0].replace('&amp;', '&')
                img_url = re.sub(r'w=\d+', 'w=600', img_url)
                replacements[pid] = img_url
                print(f"Found {q}: {img_url}")
            else:
                print(f"No match for {q}")
    except Exception as e:
        print(f"Error for {q}: {e}")

# Now update the HTML files
if len(replacements) > 0:
    files = ['c:/Users/Dell/OneDrive/Desktop/IT project/index.html', 'c:/Users/Dell/OneDrive/Desktop/IT project/products.html']
    for filepath in files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            for pid, url in replacements.items():
                pattern_img = r'(<div class="product-card">[\s\S]*?<img src=")[^"]+(" alt="[^"]+" class="product-card-img">[\s\S]*?data-id="' + pid + r'")'
                content = re.sub(pattern_img, r'\g<1>' + url + r'\g<2>', content)
                
                pattern_data_img = r'(data-id="' + pid + r'" data-title="[^"]+" data-image=")[^"]+(")'
                content = re.sub(pattern_data_img, r'\g<1>' + url + r'\g<2>', content)
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Successfully updated {filepath}")
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
