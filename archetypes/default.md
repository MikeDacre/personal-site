---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
description: ""                # required — one sentence, used for <meta description> (§ 7.2)
audience: ""                   # REQUIRED: patients | colleagues | both — load-bearing, never omit (§ 7.2)
date: {{ dateFormat "2006-01-02" .Date }}
lastmod: {{ dateFormat "2006-01-02" .Date }}
draft: true
---
