import re
p = "app/(commerce)/shop/[id]/products/add.tsx"
s = open(p).read()
m = re.search(r"\.from\('products'\)\.insert\(\{([\s\S]*?)\}\)", s)
if not m:
    print("⚠️ products insert not found"); raise SystemExit
inner = m.group(1)
orig = inner
if 'selling_price' not in inner:
    inner = re.sub(r'\bprice\s*:', 'selling_price:', inner)
if 'cost_price' not in inner:
    inner += "\n        cost_price: 0,"
if not re.search(r'\bstock_quantity\s*:', inner):
    inner = re.sub(r'\bstock\s*:', 'stock_quantity:', inner)
if not re.search(r'\bsku\s*:', inner):
    inner += "\n        sku: 'SKU-' + Date.now().toString(36).toUpperCase(),"
if re.search(r'\b(image_url|image_urls|photos)\s*:', inner) and 'images' not in inner:
    inner = re.sub(r'\b(image_url|image_urls|photos)\s*:', 'images:', inner)
s = s.replace(m.group(0), ".from('products').insert({" + inner + "})")
open(p, "w").write(s)
print("✅ add.tsx insert mapped:" if inner != orig else "✅ already aligned")
print(inner)
