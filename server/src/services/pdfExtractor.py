import sys
import os
import re
import json
import argparse
import pymupdf

def extract_catalog_from_pdf(pdf_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    products = []
    seen_skus = set()

    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text('blocks')
        drawings = page.get_drawings()

        # Extract horizontal lines to locate row boundaries
        h_lines = sorted(list(set(
            round(d['rect'].y0, 1) 
            for d in drawings 
            if d['rect'].width > 150 and d['rect'].height < 6
        )))

        for b in blocks:
            text = b[4].strip()
            # SKU pattern: alphanumeric with hyphens, not header words
            if re.match(r'^[A-Z0-9]{3,10}(-[A-Z0-9]{1,8})?(-[A-Z0-9]{1,6})?$', text) and text.upper() not in ['IMAGES', 'CODE', 'DESCRIPTION', 'MRP', 'PRICE', 'KOHLER', 'TOTAL', 'SPECIFICATIONS']:
                sku = text
                if sku in seen_skus:
                    continue

                sku_y = (b[1] + b[3]) / 2

                # Row boundary detection
                above = [y for y in h_lines if y <= sku_y]
                below = [y for y in h_lines if y >= sku_y]
                y_top = (above[-1] + 2) if above else max(0, sku_y - 50)
                y_bot = (below[0] - 2) if below else min(page.rect.height, sku_y + 50)

                # Search row text for title & price
                row_blocks = [
                    rb for rb in blocks 
                    if rb != b and (y_top - 8) <= ((rb[1] + rb[3]) / 2) <= (y_bot + 8)
                ]

                price = 0.0
                name = ''
                desc = ''

                for rb in row_blocks:
                    t = rb[4].strip()
                    clean_p = re.sub(r'[^0-9]', '', t)
                    if clean_p and 3 <= len(clean_p) <= 8 and (',' in t or re.match(r'^\d+$', t)):
                        price = float(clean_p)
                    elif not name and not t.startswith('Dimensions:') and len(t) > 3:
                        name = t.split('\n')[0].strip()
                        desc = t
                    elif t.startswith('Dimensions:'):
                        desc += ' ' + t

                # Crop image from the left image column (x: 15 to 160)
                clean_sku = re.sub(r'[^a-zA-Z0-9-_]', '_', sku)
                img_filename = f"{clean_sku}.png"
                img_path = os.path.join(out_dir, img_filename)

                try:
                    rect = pymupdf.Rect(15, y_top, 160, y_bot)
                    pix = page.get_pixmap(clip=rect, dpi=150)
                    pix.save(img_path)
                    has_image = True
                except Exception as img_err:
                    has_image = False

                seen_skus.add(sku)
                products.append({
                    'page': page_num + 1,
                    'sku': sku,
                    'name': name or f"Product {sku}",
                    'price': price,
                    'description': desc or name or sku,
                    'category': 'Brochure Catalog',
                    'unit': 'pcs',
                    'image_file': img_filename if has_image else None
                })

    return products

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Extract product catalog and images from PDF brochure")
    parser.add_argument('--input', required=True, help="Path to input PDF file")
    parser.add_argument('--outdir', required=True, help="Directory to save extracted images and metadata")
    args = parser.parse_args()

    try:
        results = extract_catalog_from_pdf(args.input, args.outdir)
        meta_file = os.path.join(args.outdir, 'results.json')
        with open(meta_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"SUCCESS: Extracted {len(results)} products to {meta_file}")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
