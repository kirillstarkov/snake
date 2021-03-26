class DOMManipulator {

    find(selector, container = document) {
        let found = container.querySelectorAll(selector);
        return found.length === 1 ? found[0] : found;
    }
}

class Grid extends DOMManipulator{
    constructor({boxSize, borderSize, gridCount, gridCssCellClass, gridContainer}) {
        super();

        this.boxSize = boxSize; 
        this.borderSize = borderSize;
        this.gridCount = gridCount;
        this.gridCssCellClass = gridCssCellClass;
        this.gridContainer = this.find(gridContainer);

        this.#_init();
    }

    #_init() {
        this.gridContainer.style.width = this.gridContainer.style.height = (this.boxSize * this.gridCount) + 'px';

        for (let index = 0; index < this.gridCount; index++) {
            this.gridContainer.append(this.#_createRow(index))
        }
    }

    #_createRow(row) {
        let fragment = new DocumentFragment();
        for (let index = 0; index < this.gridCount; index++) {
            fragment.append(this.#_createCell(row, index))
        }
        return fragment;
    }

    #_createCell(row, cell) { 
        const div = document.createElement('div');
        div.classList.add(this.gridCssCellClass);
        div.setAttribute('data-cell', cell);
        div.setAttribute('data-row', row);
        div.style.width = div.style.height = (this.boxSize - this.borderSize) + 'px';
        return div;
    }

}

class Snake extends Grid {

    #_snake = null;
    #_processGame = null;
    #_score = 0;
    #_food = null;
    #_createFood = document.createElement('img');
    #_controlsForm = this.find('#snake-controls-form');
    #_startBtn = this.find('#snake-start-game');
    #_endBtn = this.find('#snake-end-game');
    #_messageBox = this.find('#snake-message');
    #_scoreContainer = this.find('#snake-score');
    

    constructor({boxSize, borderSize,gridCount, foodUrl}) {
        super({boxSize, borderSize, gridCount, gridCssCellClass: 'snake-cell', gridContainer: '#snake-container'});

        this.speed = 500;
        this.direction = 'left';
        this.foodUrl = foodUrl;

        this.#_init()
    }

    startGame(){
        this.#_snake = this.#_createSnake(Math.floor(this.gridCount / 2), Math.floor(this.gridCount / 2), 5 );
        this.#_createFood.src = this.foodUrl;
        this.#_generateBoxForEat(this.#_randomPosition());

        this.#_startBtn.style.display = "none";
        this.#_endBtn.style.display = null;
        

        this.speed = this.#_controlsForm.speed.value;
        this.#_messageBox.innerHTML = 'Welcome to Snake!';

        this.#_processGame = setInterval(() => {
            // ----------------------------------
            // вызвать здесь  метод noWallMode, который реализует возможность змейки проходить через стены  
            // Нужно чтобы метод noWallMode работала так
            // let {
            //     cell,
            //     row
            // } = noWallMode(snake[0])
            // ----------------------------------

            let { cell, row} = this.#_noWallMode(this.#_snake[0]);

            // let { cell, row } = this.#_snake[0];

            switch(this.direction) {
                case 'left': {
                    this.#_snake.unshift({
                        cell: cell -1,
                        row
                    })
                } break;

                case 'up': {
                    this.#_snake.unshift({
                        cell,
                        row: row - 1
                    })
                } break;

                case 'right': {
                    this.#_snake.unshift({
                        cell: cell + 1,
                        row
                    })
                } break;

                case 'down': {
                    this.#_snake.unshift({
                        cell,
                        row: row +1
                    })
                } break;
            }

            this.#_clear();
            this.#_update();

        }, this.speed)

    }

    endGame(){
            clearTimeout(this.#_processGame);

        setTimeout(() => {
            this.#_startBtn.style.display = null;
            this.#_endBtn.style.display = "none";
            this.#_messageBox.innerHTML = 'Game over !';
            this.#_score = 0;
            this.#_scoreContainer.innerHTML = `Score: ${this.#_score}`;
            let box = this.find(`[data-cell="${this.#_food.foodCell}"][data-row="${this.#_food.foodRow}"]`, this.gridContainer);
            box.innerHTML = null;
            this.#_clear()
        }, 100)
    }

    #_init(){
        document.addEventListener('keydown', (event) => this.#_updateDirection(event));
        this.#_startBtn.addEventListener('click', (event) => this.startGame(event));
        this.#_endBtn.addEventListener('click', (event) => this.endGame(event));
    }

    #_updateDirection(keyboardEvent) {
        
        if(keyboardEvent.keyCode == 37 && this.direction != 'right') this.direction = 'left';
        else if(keyboardEvent.keyCode == 38 && this.direction != 'down') this.direction = 'up';
        else if(keyboardEvent.keyCode == 39 && this.direction != 'left') this.direction = 'right';
        else if(keyboardEvent.keyCode == 40 && this.direction != 'up') this.direction = 'down';
    
        // console.log(this.direction);
    }

    #_createSnake(startCell, startRow, count) {
        let arr = [];

        for (let index = 0; index < count; index++) {
            arr.push({
                cell: startCell + index,
                row: startRow,
            })
        }

        return arr;
    }

    #_clear() {
        let cells = this.find('.snake', this.gridContainer);
        for(const cell of cells) {
            cell.className = this.gridCssCellClass;
        }
    }

    #_update() {

        this.#_checkOnEated (this.#_food);
        
        this.#_checkOnTailCrush();

        for(const [index, snakePart] of this.#_snake.entries()) {
            let cell = this.#_findByCoords(snakePart.cell, snakePart.row);
            if(index == 0) {
                console.log(cell);
                cell.classList.add('snake-head', 'snake');
            } else {
                cell.classList.add('snake-body', 'snake');
            } 
        }
    }

    #_findByCoords(cell, row) {
        return this.find(`[data-cell="${cell}"][data-row="${row}"]`, this.gridContainer)
    }

    #_checkOnEated ({foodCell, foodRow}) {
        let { cell, row } = this.#_snake[0];
        if (!(cell == foodCell && row == foodRow)) {
            this.#_snake.pop();
        } else {
            this.#_score += 1;
            this.#_scoreContainer.innerHTML = `Score: ${this.#_score}`;
            this.#_generateBoxForEat(this.#_randomPosition())
        }
    }

    #_generateBoxForEat ({randCell, randRow}) {
        let box = this.find(`[data-cell="${randCell}"][data-row="${randRow}"]`, this.gridContainer);
        box.appendChild(this.#_createFood);
        let foodCell = randCell;
        let foodRow = randRow;
        return this.#_food = {foodCell, foodRow};
    }

    #_randomPosition() {
        let randCell = Math.round(Math.random()*(this.gridCount - 1));
        let randRow = Math.round(Math.random()*(this.gridCount - 1));
        for (let i = 0; i < this.#_snake.length ; i++){
            let { cell, row} = this.#_snake[i];
            if (randCell == cell && randRow == row) {
                randCell = Math.round(Math.random()*(this.gridCount - 1));
                randRow = Math.round(Math.random()*(this.gridCount - 1));
            } 
        }
        return {randCell, randRow};
    }

    #_checkOnTailCrush() {
        let snakeHead = this.#_snake[0];
        for (let i = 1; i < this.#_snake.length ; i++){
            let {cell, row} = this.#_snake[i];
            if (snakeHead.cell == cell && snakeHead.row == row) {
                this.endGame();
                alert('Tail Crash');
            } 
        }
    }

    #_noWallMode(obj) {
        if (obj.cell < 0){
            obj.cell = 12;
        } else if (obj.cell > 12) {
            obj.cell = 0;
        } else if (obj.row < 0) {
            obj.row = 12;
        } else if (obj.row > 12) {
            obj.row = 0;
        }
        return obj;
    }
}


new Snake({
    boxSize: 32,
    borderSize: 2,
    gridCount: 13,
    foodUrl: './img/apple.png'
})