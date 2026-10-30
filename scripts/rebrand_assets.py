import zlib
import struct
import os
import subprocess

def decode_png(path):
    with open(path, "rb") as f:
        data = f.read()
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"Not a valid PNG: {path}")
    idx = 8
    idat = b""
    w, h, depth, color_type = 0, 0, 0, 0
    while idx < len(data):
        l, tag = struct.unpack(">I4s", data[idx:idx+8])
        chunk_data = data[idx+8:idx+8+l]
        if tag == b"IHDR":
            w, h, depth, color_type = struct.unpack(">IIBB", chunk_data[:10])
        elif tag == b"IDAT":
            idat += chunk_data
        idx += 12 + l
    bpp = 4 if color_type == 6 else (3 if color_type == 2 else 1)
    raw = zlib.decompress(idat)
    stride = 1 + w * bpp
    out = bytearray(w * h * bpp)
    for y in range(h):
        ft = raw[y * stride]
        row = bytearray(raw[y * stride + 1 : (y + 1) * stride])
        prior = out[(y - 1) * w * bpp : y * w * bpp] if y > 0 else None
        if ft == 1:
            for x in range(bpp, len(row)):
                row[x] = (row[x] + row[x - bpp]) & 0xFF
        elif ft == 2:
            if prior:
                for x in range(len(row)):
                    row[x] = (row[x] + prior[x]) & 0xFF
        elif ft == 3:
            for x in range(len(row)):
                left = row[x - bpp] if x >= bpp else 0
                up = prior[x] if prior else 0
                row[x] = (row[x] + ((left + up) >> 1)) & 0xFF
        elif ft == 4:
            for x in range(len(row)):
                a = row[x - bpp] if x >= bpp else 0
                b = prior[x] if prior else 0
                c = prior[x - bpp] if (prior and x >= bpp) else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                row[x] = (row[x] + pr) & 0xFF
        out[y * w * bpp : (y + 1) * w * bpp] = row
    return w, h, bpp, out

def encode_png_rgba(w, h, rgba_bytes):
    raw = bytearray()
    for y in range(h):
        raw.append(0) # filter None
        raw.extend(rgba_bytes[y * w * 4 : (y + 1) * w * 4])
    compress = zlib.compress(bytes(raw), 9)
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)) # 8-bit RGBA
    png += chunk(b"IDAT", compress)
    png += chunk(b"IEND", b"")
    return png

def crop_image(img, w, h, x0, y0, cw, ch):
    out = bytearray(cw * ch * 4)
    for cy in range(ch):
        sy = y0 + cy
        if 0 <= sy < h:
            sx_start = max(0, x0)
            sx_end = min(w, x0 + cw)
            valid_w = sx_end - sx_start
            if valid_w > 0:
                dst_offset = (cy * cw + (sx_start - x0)) * 4
                src_offset = (sy * w + sx_start) * 4
                out[dst_offset : dst_offset + valid_w * 4] = img[src_offset : src_offset + valid_w * 4]
    return out

def main():
    base_user = "/Users/vivek/.gemini/antigravity/brain/ff8493e6-318e-4716-bc90-7011947a0004/.user_uploaded"
    banner_src = os.path.join(base_user, "media_1793369837451_0b8da087.png")
    mascot_src = os.path.join(base_user, "media_1793369837600_31319dfd.jpg")
    sheet_src = os.path.join(base_user, "media_1793369837507_55944de7.png")

    brand_dir = "images/brand"
    os.makedirs(brand_dir, exist_ok=True)

    print("1. Extracting assets from asset sheet...")
    w, h, bpp, img = decode_png(sheet_src)

    # Crop definitions for the assets from sheet
    assets = [
        ("logo_horizontal", 458, 77, 304, 95),
        ("logo_stacked", 799, 24, 183, 148),
        ("app_icon_squircle", 29, 195, 121, 120),
        ("app_icon_mark", 152, 195, 147, 120),
        ("wordmark", 337, 195, 263, 120),
        ("logo_mark", 605, 195, 120, 120),
        ("logo_monochrome", 773, 195, 236, 118)
    ]

    for name, x0, y0, cw, ch in assets:
        cropped_rgba = crop_image(img, w, h, x0, y0, cw, ch)
        png_data = encode_png_rgba(cw, ch, cropped_rgba)
        out_path = os.path.join(brand_dir, f"{name}.png")
        with open(out_path, "wb") as f:
            f.write(png_data)
        print(f"  Saved {out_path} ({cw}x{ch})")

    print("\n2. Processing high-res primary logo and splash banner...")
    bw, bh, bbpp, bimg = decode_png(banner_src)
    # Save the master primary logo with Mittu
    with open(banner_src, "rb") as f_in, open(os.path.join(brand_dir, "logo_primary_with_mittu.png"), "wb") as f_out:
        f_out.write(f_in.read())
    with open(banner_src, "rb") as f_in, open(os.path.join(brand_dir, "varnacular_splash.png"), "wb") as f_out:
        f_out.write(f_in.read())
    print("  Saved images/brand/logo_primary_with_mittu.png and varnacular_splash.png (1024x409)")

    print("\n3. Generating PWA app icons featuring full logo on clean contrasting white background...")
    # Save copy of mascot artwork
    with open(mascot_src, "rb") as f_in, open(os.path.join(brand_dir, "mittu_avatar_1024.jpg"), "wb") as f_out:
        f_out.write(f_in.read())

    def make_centered_icon(src_img, sw, sh, size, pad_ratio=0.92, bg_color=(255, 255, 255, 255)):
        max_w = int(size * pad_ratio)
        scale = max_w / sw
        tw = max_w
        th = int(sh * scale)
        if th > int(size * pad_ratio):
            th = int(size * pad_ratio)
            scale = th / sh
            tw = int(sw * scale)
        
        scaled = bytearray(tw * th * 4)
        for dy in range(th):
            sy = dy * (sh - 1) / max(1, (th - 1))
            sy0 = int(sy)
            sy1 = min(sh - 1, sy0 + 1)
            fy = sy - sy0
            for dx in range(tw):
                sx = dx * (sw - 1) / max(1, (tw - 1))
                sx0 = int(sx)
                sx1 = min(sw - 1, sx0 + 1)
                fx = sx - sx0
                for c in range(4):
                    c00 = src_img[(sy0 * sw + sx0)*4 + c]
                    c10 = src_img[(sy0 * sw + sx1)*4 + c]
                    c01 = src_img[(sy1 * sw + sx0)*4 + c]
                    c11 = src_img[(sy1 * sw + sx1)*4 + c]
                    top = c00 * (1 - fx) + c10 * fx
                    bot = c01 * (1 - fx) + c11 * fx
                    scaled[(dy * tw + dx)*4 + c] = int(round(top * (1 - fy) + bot * fy))
        
        canvas = bytearray(size * size * 4)
        for i in range(size * size):
            canvas[i*4] = bg_color[0]
            canvas[i*4 + 1] = bg_color[1]
            canvas[i*4 + 2] = bg_color[2]
            canvas[i*4 + 3] = bg_color[3]
        
        ox = (size - tw) // 2
        oy = (size - th) // 2
        for y in range(th):
            for x in range(tw):
                sr = scaled[(y * tw + x)*4]
                sg = scaled[(y * tw + x)*4 + 1]
                sb = scaled[(y * tw + x)*4 + 2]
                sa = scaled[(y * tw + x)*4 + 3] / 255.0
                idx = ((oy + y) * size + (ox + x)) * 4
                canvas[idx] = int(round(sr * sa + canvas[idx] * (1 - sa)))
                canvas[idx + 1] = int(round(sg * sa + canvas[idx + 1] * (1 - sa)))
                canvas[idx + 2] = int(round(sb * sa + canvas[idx + 2] * (1 - sa)))
                canvas[idx + 3] = 255
        return encode_png_rgba(size, size, canvas)

    # App Icons: Generated from high-res mascot avatar artwork (Mittu monkey in jungle, full bleed)
    subprocess.run(["sips", "-s", "format", "png", "-z", "512", "512", mascot_src, "-o", "icon-512.png"], check=True)
    subprocess.run(["sips", "-s", "format", "png", "-z", "512", "512", mascot_src, "-o", "icon-512-maskable.png"], check=True)
    subprocess.run(["sips", "-s", "format", "png", "-z", "192", "192", mascot_src, "-o", "icon-192.png"], check=True)
    subprocess.run(["sips", "-s", "format", "png", "-z", "180", "180", mascot_src, "-o", "apple-touch-icon.png"], check=True)

    # Favicons: Cropped from sheet's Leaf V monogram (x=614, y=214, w=115, h=104)
    leaf_v_rgba = crop_image(img, w, h, 614, 214, 115, 104)
    with open(os.path.join(brand_dir, "favicon_leaf_v.png"), "wb") as f:
        f.write(encode_png_rgba(115, 104, leaf_v_rgba))

    def make_square_favicon(src, sw, sh, size, pad_ratio=0.88):
        max_dim = int(size * pad_ratio)
        scale = max_dim / max(sw, sh)
        tw = max(1, int(round(sw * scale)))
        th = max(1, int(round(sh * scale)))
        scaled = bytearray(tw * th * 4)
        for dy in range(th):
            sy = dy * (sh - 1) / max(1, (th - 1))
            sy0 = int(sy)
            sy1 = min(sh - 1, sy0 + 1)
            fy = sy - sy0
            for dx in range(tw):
                sx = dx * (sw - 1) / max(1, (tw - 1))
                sx0 = int(sx)
                sx1 = min(sw - 1, sx0 + 1)
                fx = sx - sx0
                for c in range(4):
                    c00 = src[(sy0 * sw + sx0)*4 + c]
                    c10 = src[(sy0 * sw + sx1)*4 + c]
                    c01 = src[(sy1 * sw + sx0)*4 + c]
                    c11 = src[(sy1 * sw + sx1)*4 + c]
                    top = c00 * (1 - fx) + c10 * fx
                    bot = c01 * (1 - fx) + c11 * fx
                    scaled[(dy * tw + dx)*4 + c] = int(round(top * (1 - fy) + bot * fy))
        canvas = bytearray(size * size * 4)
        ox = (size - tw) // 2
        oy = (size - th) // 2
        for y in range(th):
            for x in range(tw):
                for c in range(4):
                    canvas[((oy + y) * size + (ox + x))*4 + c] = scaled[(y * tw + x)*4 + c]
        return encode_png_rgba(size, size, canvas)

    png_64 = make_square_favicon(leaf_v_rgba, 115, 104, 64)
    png_32 = make_square_favicon(leaf_v_rgba, 115, 104, 32)
    png_16 = make_square_favicon(leaf_v_rgba, 115, 104, 16)
    png_48 = make_square_favicon(leaf_v_rgba, 115, 104, 48)

    with open("favicon.png", "wb") as f: f.write(png_64)
    with open("favicon-32.png", "wb") as f: f.write(png_32)
    with open("favicon-16.png", "wb") as f: f.write(png_16)

    # Standard DIB/BMP 32-bit favicon.ico via sips
    subprocess.run(["sips", "-s", "format", "ico", "favicon-32.png", "-o", "favicon.ico"], check=True)

    # Pure vector SVG generation
    w_leaf, h_leaf = 115, 104
    grid = [[0 for _ in range(w_leaf)] for _ in range(h_leaf)]
    for y in range(h_leaf):
        for x in range(w_leaf):
            idx = (y * w_leaf + x) * 4
            r, g, b, a = leaf_v_rgba[idx:idx+4]
            if a > 80:
                if r > 160 and g > 120 and b < 50: grid[y][x] = 3
                elif g > 150 and r < 120: grid[y][x] = 2
                elif g > 40 and r < 60: grid[y][x] = 1

    def trace_category(cat):
        edges = set()
        for y in range(h_leaf):
            for x in range(w_leaf):
                if grid[y][x] == cat:
                    if y == 0 or grid[y-1][x] != cat: edges.add(((x, y), (x+1, y)))
                    if x == w_leaf-1 or grid[y][x+1] != cat: edges.add(((x+1, y), (x+1, y+1)))
                    if y == h_leaf-1 or grid[y+1][x] != cat: edges.add(((x+1, y+1), (x, y+1)))
                    if x == 0 or grid[y][x-1] != cat: edges.add(((x, y+1), (x, y)))
        edge_map = {}
        for p1, p2 in edges: edge_map.setdefault(p1, []).append(p2)
        loops, visited = [], set()
        for p1, p2_list in list(edge_map.items()):
            for p2 in p2_list:
                if (p1, p2) in visited: continue
                loop, curr = [p1], p2
                visited.add((p1, p2))
                while curr != p1:
                    loop.append(curr)
                    chosen = next((nxt for nxt in edge_map.get(curr, []) if (curr, nxt) not in visited), None)
                    if not chosen: break
                    visited.add((curr, chosen))
                    curr = chosen
                if len(loop) > 3: loops.append(loop)
        return loops

    def simplify_loop(loop):
        if len(loop) < 3: return loop
        res, n = [], len(loop)
        for i in range(n):
            p_prev, p_curr, p_next = loop[(i - 1) % n], loop[i], loop[(i + 1) % n]
            if (p_curr[0] - p_prev[0]) * (p_next[1] - p_curr[1]) == (p_curr[1] - p_prev[1]) * (p_next[0] - p_curr[0]):
                continue
            res.append(p_curr)
        return res

    colors = {1: "#0a6d38", 2: "#3fb336", 3: "#ffb400"}
    svg_paths = []
    for cat in [1, 2, 3]:
        for l in trace_category(cat):
            sl = simplify_loop(l)
            if len(sl) > 2:
                d = f"M{sl[0][0]},{sl[0][1]} " + " ".join(f"L{p[0]},{p[1]}" for p in sl[1:]) + " Z"
                svg_paths.append(f'<path d="{d}" fill="{colors[cat]}"/>')

    svg_content = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w_leaf} {h_leaf}" width="64" height="64">\n  {"".join(svg_paths)}\n</svg>'
    with open("favicon.svg", "w") as f:
        f.write(svg_content)

    print("  Generated Leaf V favicons: favicon.ico, favicon.png, favicon-32.png, favicon-16.png, favicon.svg!")
    print("  Generated full-bleed Mittu app icons: icon-512.png, icon-512-maskable.png, icon-192.png, apple-touch-icon.png!")
    print("\nAll brand assets successfully generated!")

if __name__ == "__main__":
    main()
