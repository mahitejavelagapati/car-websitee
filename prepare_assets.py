import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageChops, ImageStat, ImageEnhance, ImageOps

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def get_sorted_images(folder):
    valid_exts = ('.jpg', '.jpeg', '.png')
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.lower().endswith(valid_exts)]
    files.sort(key=natural_sort_key)
    return files

def ensure_dirs():
    dirs = [
        'assets/frames/hero',
        'assets/frames/hero-mobile',
        'assets/frames/dismantle',
        'assets/frames/dismantle-mobile',
        'assets/cars'
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

def process_single_frame(args):
    src_path, dest_desktop, dest_mobile = args
    try:
        with Image.open(src_path) as img:
            img = img.convert('RGB')
            orig_w, orig_h = img.size
            aspect = orig_h / orig_w

            # Desktop 1600px wide, quality 78
            target_w_d = 1600
            target_h_d = round(target_w_d * aspect)
            img_desktop = img.resize((target_w_d, target_h_d), Image.Resampling.LANCZOS)
            img_desktop.save(dest_desktop, 'WEBP', quality=78, method=4)

            # Mobile 960px wide, quality 72
            target_w_m = 960
            target_h_m = round(target_w_m * aspect)
            img_mobile = img.resize((target_w_m, target_h_m), Image.Resampling.LANCZOS)
            img_mobile.save(dest_mobile, 'WEBP', quality=72, method=4)
            return True
    except Exception as e:
        print(f"Error processing {src_path}: {e}")
        return False

def get_dir_size_mb(folder):
    total = sum(os.path.getsize(os.path.join(folder, f)) for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f)))
    return round(total / (1024 * 1024), 2)

def main():
    ensure_dirs()

    # Find source folders
    c1_dir = 'frames/hero section/clip 1' if os.path.isdir('frames/hero section/clip 1') else 'clip1 frame.zip'
    c2_dir = 'frames/hero section/clip 2' if os.path.isdir('frames/hero section/clip 2') else 'clip 2 frame.zip'
    c3_dir = 'frames/hero section/clip 3' if os.path.isdir('frames/hero section/clip 3') else 'clip 3 frame.zip'
    dismantle_dir = 'frames/dismantle' if os.path.isdir('frames/dismantle') else 'flow clip frame.zip'

    print(f"Using source folders:\n  Clip 1: {c1_dir}\n  Clip 2: {c2_dir}\n  Clip 3: {c3_dir}\n  Dismantle: {dismantle_dir}")

    c1_frames = get_sorted_images(c1_dir)
    c2_frames = get_sorted_images(c2_dir)
    c3_frames = get_sorted_images(c3_dir)
    dismantle_frames = get_sorted_images(dismantle_dir)

    print(f"Frame counts: C1={len(c1_frames)}, C2={len(c2_frames)}, C3={len(c3_frames)}, Dismantle={len(dismantle_frames)}")

    # Check join between C1 and C2
    c2_start_idx = 0
    if c1_frames and c2_frames:
        with Image.open(c1_frames[-1]) as img1, Image.open(c2_frames[0]) as img2:
            diff = ImageStat.Stat(ImageChops.difference(img1.convert('RGB'), img2.convert('RGB'))).mean
            avg_diff = sum(diff) / len(diff)
            print(f"Mean pixel diff between C1 last and C2 first: {avg_diff:.2f}")
            if avg_diff < 5.0:
                print("Skipping first frame of Clip 2 to eliminate stutter at join.")
                c2_start_idx = 1

    # Check join between C2 and C3
    c3_start_idx = 0
    if c2_frames and c3_frames:
        with Image.open(c2_frames[-1]) as img2, Image.open(c3_frames[0]) as img3:
            diff = ImageStat.Stat(ImageChops.difference(img2.convert('RGB'), img3.convert('RGB'))).mean
            avg_diff = sum(diff) / len(diff)
            print(f"Mean pixel diff between C2 last and C3 first: {avg_diff:.2f}")
            if avg_diff < 5.0:
                print("Skipping first frame of Clip 3 to eliminate stutter at join.")
                c3_start_idx = 1

    hero_sources = c1_frames + c2_frames[c2_start_idx:] + c3_frames[c3_start_idx:]
    print(f"Total joined hero frames: {len(hero_sources)}")

    # Prepare batch tasks for hero
    hero_tasks = []
    for i, src in enumerate(hero_sources, 1):
        num_str = f"{i:04d}"
        dest_d = os.path.join('assets/frames/hero', f"frame_{num_str}.webp")
        dest_m = os.path.join('assets/frames/hero-mobile', f"frame_{num_str}.webp")
        hero_tasks.append((src, dest_d, dest_m))

    print("Converting Hero frames to WebP (Desktop & Mobile)...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(process_single_frame, hero_tasks))
    print("Hero frames conversion complete.")

    # Prepare batch tasks for dismantle
    dismantle_tasks = []
    for i, src in enumerate(dismantle_frames, 1):
        num_str = f"{i:04d}"
        dest_d = os.path.join('assets/frames/dismantle', f"frame_{num_str}.webp")
        dest_m = os.path.join('assets/frames/dismantle-mobile', f"frame_{num_str}.webp")
        dismantle_tasks.append((src, dest_d, dest_m))

    print("Converting Dismantle frames to WebP (Desktop & Mobile)...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(process_single_frame, dismantle_tasks))
    print("Dismantle frames conversion complete.")

    # Create Lineup Product Images in assets/cars/
    # Reference: dismantle frame 1 (or clean side profile reference)
    ref_path = dismantle_frames[0] if dismantle_frames else 'e1.png'
    print(f"Generating 5 lineup product images using reference: {ref_path}...")
    
    with Image.open(ref_path) as ref_img:
        ref_img = ref_img.convert('RGB')
        # Target 1600x900 (16:9)
        base_canvas = Image.new('RGB', (1600, 900), color=(7, 8, 10)) # #07080A
        # Scale car to fill ~70% of width
        target_car_w = int(1600 * 0.70)
        scale = target_car_w / ref_img.width
        target_car_h = int(ref_img.height * scale)
        scaled_car = ref_img.resize((target_car_w, target_car_h), Image.Resampling.LANCZOS)
        
        # Position so wheels sit at 72% of image height
        # 900 * 0.72 = 648
        # Center horizontally: (1600 - target_car_w) // 2
        pos_x = (1600 - target_car_w) // 2
        pos_y = 648 - int(target_car_h * 0.82)
        base_canvas.paste(scaled_car, (pos_x, pos_y))

        # Models specification:
        # gt-e.webp — the hero car, matte graphite grand tourer coupe
        base_canvas.save('assets/cars/gt-e.webp', 'WEBP', quality=85)

        # s.webp — four-door sport sedan, satin bone white
        # Create subtle tint/brightness adjustment
        enhancer = ImageEnhance.Brightness(base_canvas)
        s_img = enhancer.enhance(1.22)
        s_img = ImageEnhance.Color(s_img).enhance(0.4)
        s_img.save('assets/cars/s.webp', 'WEBP', quality=85)

        # x.webp — SUV with a coupe roofline, midnight blue
        x_img = ImageOps.colorize(ImageOps.grayscale(base_canvas), black="#07080A", white="#5A7D9A", mid="#182A3A")
        # Blend with original for subtle realism
        x_blend = Image.blend(base_canvas, x_img, 0.45)
        x_blend.save('assets/cars/x.webp', 'WEBP', quality=85)

        # r.webp — two-seat track coupe with a fixed rear wing, satin black with thin red accents
        r_img = ImageEnhance.Brightness(base_canvas).enhance(0.85)
        r_img = ImageEnhance.Contrast(r_img).enhance(1.3)
        r_img.save('assets/cars/r.webp', 'WEBP', quality=85)

        # one.webp — concept hypercar, extremely low and long, liquid silver
        one_img = ImageEnhance.Brightness(base_canvas).enhance(1.35)
        one_img = ImageEnhance.Contrast(one_img).enhance(1.15)
        one_img = ImageOps.colorize(ImageOps.grayscale(one_img), black="#07080A", white="#E8EEF5", mid="#444E58")
        one_blend = Image.blend(base_canvas, one_img, 0.5)
        one_blend.save('assets/cars/one.webp', 'WEBP', quality=85)

    print("Product images generated in assets/cars/.")

    # Reporting
    h_d_cnt = len(os.listdir('assets/frames/hero'))
    h_d_sz = get_dir_size_mb('assets/frames/hero')
    h_m_cnt = len(os.listdir('assets/frames/hero-mobile'))
    h_m_sz = get_dir_size_mb('assets/frames/hero-mobile')

    d_d_cnt = len(os.listdir('assets/frames/dismantle'))
    d_d_sz = get_dir_size_mb('assets/frames/dismantle')
    d_m_cnt = len(os.listdir('assets/frames/dismantle-mobile'))
    d_m_sz = get_dir_size_mb('assets/frames/dismantle-mobile')

    print("\n--- STATS ---")
    print(f"Hero Desktop: {h_d_cnt} frames, {h_d_sz} MB")
    print(f"Hero Mobile: {h_m_cnt} frames, {h_m_sz} MB")
    print(f"Dismantle Desktop: {d_d_cnt} frames, {d_d_sz} MB")
    print(f"Dismantle Mobile: {d_m_cnt} frames, {d_m_sz} MB")

if __name__ == '__main__':
    main()
