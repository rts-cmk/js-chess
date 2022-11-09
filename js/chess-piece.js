import ChessMove from "./chess-move.js";

export class ChessPiece extends EventTarget {

    static get PAWN() { return 'pawn' };
    static get ROOK() { return 'rook' };
    static get KNIGHT() { return 'knight' };
    static get BISHOP() { return 'bishop' };
    static get QUEEN() { return 'queen' };
    static get KING() { return 'king' };

    static get WHITE() { return 'white' };
    static get BLACK() { return 'black' };

    static get PIECES() { return [Pawn, Rook, Knight, Bishop, Queen, King] };

    static get RANKS() { return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] }

    #color;
    #type;
    #value;

    #rank;
    #file;

    #hasMoved;

    #movePattern;

    get color() { return this.#color };
    get oppositeColor() { return this.color === ChessPiece.WHITE ? ChessPiece.BLACK : ChessPiece.WHITE };
    get type() { return this.#type };
    get value() { return this.#value };

    get rank() { return ChessPiece.RANKS[this.#rank] };
    get rankIndex() { return this.#rank };
    get previousRank() { return ChessPiece.RANKS[this.#rank - 1] ?? null };
    get nextRank() { return ChessPiece.RANKS[this.#rank + 1] ?? null };
    get file() { return this.#file };

    get hasMoved() { return this.#hasMoved };
    get movePattern() { return this.#movePattern };

    constructor(color, type, value, rank, file, movePattern = {}) {
        super();
        this.#color = color;
        this.#type = type;
        this.#value = value;

        this.#rank = ChessPiece.RANKS.indexOf(rank);
        this.#file = file;

        this.#hasMoved = false;

        this.#movePattern = movePattern;
    }

    isLegalMove(board, rank, file, captureOnly = false) {
        let legalMoves = ChessMove.getLegalMoves(board, this, captureOnly);
        return legalMoves.some(move => move.rank === rank && move.file === file);
    }

    moveTo(rank, file) {
        if (rank !== this.rank || file !== this.#file) {
            this.#rank = ChessPiece.RANKS.indexOf(rank);
            this.#file = file;
            this.#hasMoved = true;
        }
    }

    copy() {
        let type = ChessPiece.PIECES.find(piece => piece.name === this.constructor.name);
        let copy = new type(this.color, this.rank, this.file, this.movePattern);

        copy.#hasMoved = this.#hasMoved;

        return copy;
    }

    getRelativeRank(value = 0) { return ChessPiece.RANKS[this.#rank + value]; }

}

export class Pawn extends ChessPiece {

    constructor(color, rank, file) {
        super(color, ChessPiece.PAWN, 1, rank, file, {
            forward: true, doubleFirstMove: true, diagonalCapture: true, enPassant: true
        })
    }

    moveTo(rank, file) {
        super.moveTo(rank, file);

        if (this.color === ChessPiece.WHITE && this.file === 8 ||
            this.color === ChessPiece.BLACK && this.file === 1) {

            this.dispatchEvent(new CustomEvent('promotion', { detail: { piece: this } }));
        }
    }
}

export class Rook extends ChessPiece {
    constructor(color, rank, file) {
        super(color, ChessPiece.ROOK, 5, rank, file, { orthogonal: true, unlimited: true, castle: true });
    }
}

export class Knight extends ChessPiece {
    constructor(color, rank, file) {
        super(color, ChessPiece.KNIGHT, 3, rank, file, { knight: true });
    }
}

export class Bishop extends ChessPiece {
    constructor(color, rank, file) {
        super(color, ChessPiece.BISHOP, 3, rank, file, { diagonal: true, unlimited: true });
    }
}

export class Queen extends ChessPiece {
    constructor(color, rank, file) {
        super(color, ChessPiece.QUEEN, 9, rank, file, { orthogonal: true, diagonal: true, unlimited: true });
    }
}

export class King extends ChessPiece {
    constructor(color, rank, file) {
        super(color, ChessPiece.KING, 0, rank, file, { orthogonal: true, diagonal: true, castle: true, avoidCheck: true });
    }

    moveTo(rank, file) {
        if (Math.abs(this.rankIndex - ChessPiece.RANKS.indexOf(rank)) === 2) {
            this.dispatchEvent(new CustomEvent('castle', {
                detail: {
                    piece: this,
                    rank, file,
                    kingSide: this.rankIndex < ChessPiece.RANKS.indexOf(rank)
                }
            }));
        }

        super.moveTo(rank, file);
    }
}