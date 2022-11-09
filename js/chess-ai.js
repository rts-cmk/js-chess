import { ChessPiece } from "./chess-piece.js";
import ChessMove from "./chess-move.js";

export default class ChessAI {

    #board;
    #color;

    constructor(board, color = ChessPiece.BLACK) {
        this.#board = board;
        this.#color = color;
    }

    takeTurn() {
        let pieces = this.#board.getPiecesByColor(this.#color);
        let moves = pieces.map(piece => {
            let legalMoves = ChessMove.getLegalMoves(this.#board, piece);
            let maxValue = Math.max(...legalMoves.map(move => move.value));
            return { piece: piece, moves: legalMoves.filter(move => move.value === maxValue), value: maxValue };
        }).filter(move => move.moves.length > 0);

        moves.sort((a, b) => b.value - a.value);

        let bestmoves = moves.filter(move => move.value === moves[0].value);

        let randomBestPiece = bestmoves[Math.floor(Math.random() * bestmoves.length)];

        if (randomBestPiece !== undefined) {
            let randomBestMove = randomBestPiece.moves[Math.floor(Math.random() * randomBestPiece.moves.length)];
            this.#board.makeMove(randomBestPiece.piece, randomBestMove.rank, randomBestMove.file, true);
        }
        
    }
}