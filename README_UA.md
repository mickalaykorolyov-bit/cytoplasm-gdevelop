# CYTOPLASM — Living Architecture v0.5.1

**Виправлення клавіатури.** v0.5 використовувала символ клавіші (`event.key`). Українська розкладка передавала `а`, `у`, `к` замість F, E, R, і гра ігнорувала дії. Тепер використовується фізичне розташування клавіш (`event.code`) з резервною підтримкою українських символів. **Перемикатися на англійську розкладку не потрібно.**

Керування: A/D або стрілки — рух; Space — стрибок; **F — взяти/покласти; E — кинути; R — заморозити/розморозити**; T — жива нитка (друга кімната); N — перезапуск.

Підійди до предмета → F → Space → E → R. Зафіксований предмет покривається липкою горизонтальною платформою.

**Браузерна гра:** [RawGitHack — прямий доступ до main](https://raw.githack.com/mickalaykorolyov-bit/cytoplasm-gdevelop/main/docs/index.html) (не залежить від черги GitHub Pages). [GitHub Pages](https://mickalaykorolyov-bit.github.io/cytoplasm-gdevelop/) оновиться після успішного розгортання.

- `docs/index.html`, `index.html` — браузерна версія 16:9
- `Cytoplasm_GDevelop_v051.json` — проєкт GDevelop
- `GameScene_v051.js`, `GameCore_v051.js` — код
- `tests/test_controls_v051.cjs` — регресійні тести
