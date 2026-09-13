Placeholder asset folder.

Expected files (referenced by index.html / shape.html):
  assets/round.jpg, princess.jpg, emerald.jpg, oval.jpg, pear.jpg, radiant.jpg, heart.jpg
  assets/hero-video-5.mp4, hero-video-5-mobile.mp4

Per-product placeholders (referenced by catalogue-data.js), one folder per category/shape:
  assets/products/<category>/<shape>/<product-id>-1.jpg
  assets/products/<category>/<shape>/<product-id>-2.jpg
  assets/products/<category>/<shape>/<product-id>-3.jpg
  assets/products/<category>/<shape>/<product-id>-video.mp4

category = natural | lab | coloured
shape    = round | princess | emerald | oval | pear | radiant | heart
product-id = e.g. natural-round-1 ... natural-round-8

None of these files are included here — drop your real photography/video in with the
same filenames (or update the paths in catalogue-data.js) and everything will pick them up
automatically, no HTML changes needed.
