============================================================
  BEFORE / AFTER ఫలితాల ఫోటోలు — ఇక్కడ పెట్టండి
  (Treatment results — put before & after images here)
============================================================

ప్రతి ఫలితానికి 2 ఫోటోలు పెట్టండి (Put 2 images per result):
   <slug>-before.jpg   (ముందు)
   <slug>-after.jpg    (తరువాత)

ఏ slug ఏ చికిత్స — assets/js/results.js లో MEDICARE_RESULTS లో ఉంది.
ప్రస్తుత slugs (current):
   acne          → మొటిమలు / Acne
   acne-scars    → మొటిమల మచ్చలు / Acne Scars
   pigmentation  → పిగ్మెంటేషన్ / Pigmentation
   hair          → జుట్టు పెరుగుదల / Hair Growth (PRP/GFC)
   laser-hair    → లేజర్ హెయిర్ రిమూవల్ / Laser Hair Removal
   tattoo        → టాటూ రిమూవల్ / Tattoo Removal

ఉదాహరణ (example): acne-before.jpg , acne-after.jpg

కొత్త చికిత్స add చేయాలంటే — results.js లో MEDICARE_RESULTS list లో
ఒక లైన్ చేర్చి, ఆ slug తో 2 ఫోటోలు ఇక్కడ పెట్టండి.

గమనికలు / Notes:
 • ఫోటోలు లేకపోతే ఆ card కనిపించదు; అస్సలు ఫోటోలు లేకపోతే
   "Before & After" section మొత్తం దాగి ఉంటుంది (no broken blanks).
 • Size: ~800x800 px square బాగుంటుంది (before & after ఒకే size).
 • ⚠️ రోగి ఫోటోలు పెట్టే ముందు వారి అనుమతి (consent) తప్పక తీసుకోండి.

------------------------------------------------------------
  👁️  కళ్ళ మాస్క్ — కొత్త ఫోటో పెట్టే ముందు తప్పక
------------------------------------------------------------
రోగి ముఖం కనిపించే ప్రతి ఫోటోలో కళ్ళ మీద నల్లటి పట్టీ ఉండాలి.
చేతితో వెయ్యక్కర్లేదు — ఈ రెండు commands చాలు:

   swift tools/eye-detect.swift assets/img/before-after/*.jpg > /tmp/eyes.tsv
   python3 tools/eye-mask.py /tmp/eyes.tsv assets/img/before-after \
           assets/img/before-after/*.jpg

ముఖం లేని ఫోటోలు (తల, పాదాలు, చెవి) అలాగే ఉండిపోతాయి.
వివరాలు: tools/README-eye-masks.md

⚠️ File పేరు మారదు కాబట్టి — assets/js/results.js లో ఉన్న
   var V = "?v=..." ని కూడా పెంచాలి. లేకపోతే browser పాత
   (మాస్క్ లేని) ఫోటోనే చూపిస్తూ ఉంటుంది.
