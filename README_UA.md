# CYTOPLASM — Living Architecture v0.3.0

**PC-first 16:9 physics puzzle-platformer — 1280×720 — two rooms.**

**[Play the PC browser demo](https://mickalaykorolyov-bit.github.io/cytoplasm-gdevelop/)**

- [GDevelop v0.3 project](./Cytoplasm_GDevelop_v030.json)
- [GameCore v0.3](./GameCore_v030.js)
- [GDevelop scene script](./GameScene_v030.js)
- [Browser HTML](./index.html) — shares the game core, not a native GDevelop export.
- [Earlier GDevelop v0.2 project](./Cytoplasm_GDevelop_v020.json)

## Керування

| Дія | Керування |
|---|---|
| Рух | A / D або ← / → |
| Стрибок | Space, W або ↑ |
| Підняти й кинути | Натиснути на предмет, перетягнути й відпустити |
| Зупинити останній кинутий предмет у польоті | **Подвійний клік будь-де на екрані** |
| Звільнити предмет і повернути біомасу | Один клік по зафіксованому предмету |
| Прив'язати предмет живою ниткою (кімната 2) | Перетягнути від зафіксованого предмета до світлої опори |
| Перезапуск кімнати | R |

## Кімнати

1. **Throw & Freeze**: зафіксуй меблі в повітрі й використовуй їх як платформи над прірвою.
2. **Living Connections**: прикріпи шафу до стельової опори, скороти живу нитку, дістанься виходу.

Прототип використовує спрощену фізику. Свідомо прибрано панель здібностей: залишається одна жива матерія, кидки, стазис, звільнення зі збереженим імпульсом, живі нитки та біомаса. Повне ручне проходження і GDevelop Preview ще потрібно перевірити.
