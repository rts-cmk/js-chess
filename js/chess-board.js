import ChessMove from './chess-move.js';
import { ChessPiece, Pawn, Rook, Knight, Bishop, Queen, King } from './chess-piece.js';
import ChessAI from './chess-ai.js';

export default class ChessBoard {

    static get RANKS() { return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] };
    static get FILES() { return [1, 2, 3, 4, 5, 6, 7, 8] };

    #pieces;

    #element;

    #selectedPiece;
    #lastMove;

    #turn;

    #ai;

    get element() { return this.#element; };
    get lastMove() { return this.#lastMove; };
    get pieces() { return this.#pieces; };
    get whitePieces() { return this.#pieces.filter(piece => piece.color === ChessPiece.WHITE); };
    get blackPieces() { return this.#pieces.filter(piece => piece.color === ChessPiece.BLACK); };

    get whiteScore() { return this.whitePieces.reduce((score, piece) => score + piece.value, 0); };
    get blackScore() { return this.blackPieces.reduce((score, piece) => score + piece.value, 0); };

    constructor(pieceList = []) {
        this.#pieces = pieceList;
        this.#element = document.createElement('table');
        this.#element.classList.add('chess-board');

        this.#selectedPiece = null;
        this.#lastMove = { piece: null, fromRank: null, fromFile: null, toRank: null, toFile: null };
        this.#turn = ChessPiece.WHITE;

        this.#ai = new ChessAI(this);

        ChessBoard.FILES.reverse().forEach(file => {
            let row = document.createElement('tr');
            row.classList.add('chess-board__row');
            ChessBoard.RANKS.forEach(rank => {
                let cell = document.createElement('td');
                cell.classList.add('chess-board__square');
                cell.dataset.rank = rank;
                cell.dataset.file = file;
                row.appendChild(cell);

                cell.addEventListener('click', () => this.makeMove(this.getPiece(rank, file), rank, file));
            });
            this.#element.appendChild(row);
        });

        if (this.#pieces.length === 0) this.reset();
    }

    #updateBoard() {
        this.#element.querySelectorAll('.chess-board__square').forEach(square => {
            delete square.dataset.piece;
            delete square.dataset.color;
        });

        this.#pieces.forEach(piece => {
            let square = this.#element.querySelector(`.chess-board__square[data-rank="${piece.rank}"][data-file="${piece.file}"]`);
            square.dataset.piece = piece.type;
            square.dataset.color = piece.color;
        });
    }

    nextTurn() {
        this.#turn = this.#turn === ChessPiece.WHITE ? ChessPiece.BLACK : ChessPiece.WHITE;

        if (this.#turn === ChessPiece.BLACK) this.#ai.takeTurn();
    }

    playerIsInCheck(color) {
        let king = this.findPiece(ChessPiece.KING, color);

        return this.squareIsAttacked(king.rank, king.file, king.oppositeColor);
    }

    playerIsCheckmate(color) {
        if (!this.playerIsInCheck(color)) return false;

        let pieces = this.getPiecesByColor(color);

        for (let piece of pieces) {
            if (ChessMove.getLegalMoves(this, piece).length > 0) {
                console.log(ChessMove.getLegalMoves(this, piece));
                return false;
            }
        }

        return true;
    }


    #showLegalMoves(piece) {
        this.#removeHighlighting();
        ChessMove.getLegalMoves(this, piece).forEach(move => {
            if (this.getPiece(move.rank, move.file)?.color === piece.oppositeColor || this.isEnPassant(piece, move.rank, move.file)) {
                this.getSquare(move.rank, move.file).classList.add('chess-board__square--capture');
            } else {
                this.getSquare(move.rank, move.file)?.classList.add('chess-board__square--highlighted');
            }
        });
    }

    #removeHighlighting() {
        this.#element.querySelectorAll('.chess-board__square').forEach(square => {
            square.classList.remove('chess-board__square--highlighted');
            square.classList.remove('chess-board__square--selected');
            square.classList.remove('chess-board__square--capture');
            square.classList.remove('chess-board__square--check');
        });

        [this.findPiece(ChessPiece.KING, 'white'), this.findPiece(ChessPiece.KING, 'black')].forEach(king => {
            if (this.playerIsInCheck(king.color)) this.getSquare(king.rank, king.file).classList.add('chess-board__square--check');
        });
    }

    #onPawnPromotion(event) {
        let piece = event.detail.piece;
        let pieceIndex = this.#pieces.indexOf(piece);

        this.#pieces.splice(pieceIndex, 1, new Queen(piece.color, piece.rank, piece.file));
    }

    #onKingCastle(event) {
        let piece = event.detail.piece;
        let kingSide = event.detail.kingSide;

        if (kingSide) {
            let rook = this.getPiece('h', piece.file);
            rook.moveTo('f', piece.file);
        } else {
            let rook = this.getPiece('a', piece.file);
            rook.moveTo('d', piece.file);
        }

        this.#updateBoard();
    }

    isEnPassant(piece, rank, file) {
        return this.#lastMove.piece?.movePattern.enPassant &&
            this.#lastMove.piece?.color === piece.oppositeColor &&
            Math.abs(this.#lastMove.fromFile - this.#lastMove.toFile) === 2 &&
            this.#lastMove.toRank === rank &&
            this.#lastMove.toFile === piece.file;
    }

    reset() {
        this.#pieces = [];

        ChessBoard.RANKS.forEach(rank => {
            this.#pieces.push(new Pawn(ChessPiece.WHITE, rank, 2));
            this.#pieces.push(new Pawn(ChessPiece.BLACK, rank, 7));
        });

        [ChessPiece.WHITE, ChessPiece.BLACK].forEach(color => {
            this.#pieces.push(new Rook(color, 'a', color === ChessPiece.WHITE ? 1 : 8));
            this.#pieces.push(new Rook(color, 'h', color === ChessPiece.WHITE ? 1 : 8));
            this.#pieces.push(new Knight(color, 'b', color === ChessPiece.WHITE ? 1 : 8));
            this.#pieces.push(new Knight(color, 'g', color === ChessPiece.WHITE ? 1 : 8));
            this.#pieces.push(new Bishop(color, 'c', color === ChessPiece.WHITE ? 1 : 8));
            this.#pieces.push(new Bishop(color, 'f', color === ChessPiece.WHITE ? 1 : 8));
            this.#pieces.push(new Queen(color, 'd', color === ChessPiece.WHITE ? 1 : 8));
            this.#pieces.push(new King(color, 'e', color === ChessPiece.WHITE ? 1 : 8));
        });

        this.#pieces.forEach(piece => piece.addEventListener('promotion', event => this.#onPawnPromotion(event)), { once: true });
        this.#pieces.forEach(piece => piece.addEventListener('castle', event => this.#onKingCastle(event)), { once: true });

        this.#updateBoard();
    }

    copy() {
        return new ChessBoard(this.#pieces.map(piece => piece.copy()));
    }

    getPiece(rank, file) {
        return this.#pieces.find(piece => piece.rank === rank && piece.file === file) ?? null;
    }

    getPiecesByColor(color) {
        return this.#pieces.filter(piece => piece.color === color);
    }

    capturePiece(rank, file) {
        this.#pieces = this.#pieces.filter(piece => piece.rank !== rank || piece.file !== file);
    }

    swapPieces(piece, rank, file) {
        let otherPiece = this.getPiece(rank, file);

        if (otherPiece) {
            otherPiece.moveTo(piece.rank, piece.file);
            piece.moveTo(rank, file);
        }
    }

    findPiece(type, color) {
        return this.#pieces.find(piece => piece.type === type && piece.color === color);
    }

    squareIsEmpty(rank, file) {
        return this.getPiece(rank, file) === null;
    }

    squareIsAttacked(rank, file, color) {
        return this.#pieces.some(piece => piece.color === color && piece.isLegalMove(this, rank, file, true));
    }

    getSquare(rank, file) {
        return this.#element.querySelector(`.chess-board__square[data-rank="${rank}"][data-file="${file}"]`);
    }

    makeMove(piece, rank, file, select = false) {

        if (select) this.#selectedPiece = piece;
        
        if (this.#turn === ChessPiece.BLACK) console.log(`AI move: ${piece.type} ${piece.rank}${piece.file} -> ${rank}${file}`);

        if (this.#turn === this.#selectedPiece?.color && this.#selectedPiece.isLegalMove(this, rank, file)) {

            if (this.getPiece(rank, file)?.color === this.#selectedPiece.oppositeColor) {
                this.capturePiece(rank, file);
            } else if (this.isEnPassant(this.#selectedPiece, rank, file)) {
                this.capturePiece(rank, file + (this.#selectedPiece.color === ChessPiece.WHITE ? -1 : 1));
            }

            this.#lastMove = {
                piece: this.#selectedPiece,
                fromRank: this.#selectedPiece.rank,
                fromFile: this.#selectedPiece.file,
                toRank: rank,
                toFile: file
            };

            this.#selectedPiece.moveTo(rank, file);

            this.#updateBoard();
            this.#removeHighlighting();

            this.#selectedPiece = null;
            this.nextTurn();
        } else if (this.#turn === piece?.color) {
            this.#selectedPiece = piece;
            this.#showLegalMoves(piece);
            this.getSquare(piece.rank, piece.file).classList.add('chess-board__square--selected');
        } else {
            this.#removeHighlighting();
            this.#selectedPiece = null;
        }
    }

}