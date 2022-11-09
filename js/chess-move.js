import { ChessPiece } from "./chess-piece.js";

export default class ChessMove {

    static #generateMoves(direction, moveLimit, board, piece) {
        let moves = [];

        for (let i = 1; i <= moveLimit; i++) {

            let move = (() => {
                switch (direction) {
                    case 'forwardwhite':
                    case 'up': return { rank: piece.rank, file: piece.file + i };
                    case 'forwardblack':
                    case 'down': return { rank: piece.rank, file: piece.file - i };
                    case 'left': return { rank: piece.getRelativeRank(-i), file: piece.file };
                    case 'right': return { rank: piece.getRelativeRank(i), file: piece.file };
                    case 'upLeft': return { rank: piece.getRelativeRank(-i), file: piece.file + i };
                    case 'upRight': return { rank: piece.getRelativeRank(i), file: piece.file + i };
                    case 'downLeft': return { rank: piece.getRelativeRank(-i), file: piece.file - i };
                    case 'downRight': return { rank: piece.getRelativeRank(i), file: piece.file - i };
                    case 'knightUpLeft': return { rank: piece.getRelativeRank(-2), file: piece.file + 1 };
                    case 'knightUpRight': return { rank: piece.getRelativeRank(2), file: piece.file + 1 };
                    case 'knightDownLeft': return { rank: piece.getRelativeRank(-2), file: piece.file - 1 };
                    case 'knightDownRight': return { rank: piece.getRelativeRank(2), file: piece.file - 1 };
                    case 'knightLeftUp': return { rank: piece.getRelativeRank(-1), file: piece.file + 2 };
                    case 'knightLeftDown': return { rank: piece.getRelativeRank(-1), file: piece.file - 2 };
                    case 'knightRightUp': return { rank: piece.getRelativeRank(1), file: piece.file + 2 };
                    case 'knightRightDown': return { rank: piece.getRelativeRank(1), file: piece.file - 2 };
                };
            })();

            let boardPiece = board.getPiece(move.rank, move.file);
            if (move.rank === null || move.file < 1 || move.file > 8) break;
            else if (boardPiece === null) { moves.push(move); continue; }
            else if (!piece.movePattern.diagonalCapture && boardPiece?.color === piece.oppositeColor) moves.push(move);
            break;
        }

        return moves;
    }

    static getLegalMoves(board, piece, captureOnly = false) {
        let moves = [];
        let direction = piece.color === ChessPiece.WHITE ? 1 : -1;
        let movePattern = piece.movePattern;
        let moveLimit = movePattern.unlimited ? 8 : 1;

        if (movePattern.doubleFirstMove && !piece.hasMoved) moveLimit = 2;

        if (movePattern.forward) {
            if (movePattern.diagonalCapture && !captureOnly) {
                ChessMove.#generateMoves('forward' + piece.color, moveLimit, board, piece).forEach(move => moves.push(move));
            }

            if (movePattern.diagonalCapture) {
                if (captureOnly || board.getPiece(piece.previousRank, piece.file + direction)?.color === piece.oppositeColor)
                    moves.push({ rank: piece.previousRank, file: piece.file + direction });

                if (captureOnly || board.getPiece(piece.nextRank, piece.file + direction)?.color === piece.oppositeColor)
                    moves.push({ rank: piece.nextRank, file: piece.file + direction });
            }
        }

        if (movePattern.enPassant) {
            if (
                board.lastMove.piece?.type === ChessPiece.PAWN &&
                board.lastMove.piece.color === piece.oppositeColor &&
                Math.abs(board.lastMove.fromFile - board.lastMove.toFile) === 2 &&
                board.lastMove.piece.file === piece.file &&
                (board.lastMove.piece.rank === piece.previousRank || board.lastMove.piece.rank === piece.nextRank)
            ) {
                moves.push({ rank: board.lastMove.piece.rank, file: piece.file + direction });
            }
        }

        if (movePattern.orthogonal) {
            ChessMove.#generateMoves('up', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('down', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('left', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('right', moveLimit, board, piece).forEach(move => moves.push(move));
        }

        if (movePattern.diagonal) {
            ChessMove.#generateMoves('upLeft', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('upRight', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('downLeft', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('downRight', moveLimit, board, piece).forEach(move => moves.push(move));
        }

        if (movePattern.knight) {
            ChessMove.#generateMoves('knightUpLeft', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('knightUpRight', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('knightDownLeft', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('knightDownRight', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('knightLeftUp', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('knightLeftDown', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('knightRightUp', moveLimit, board, piece).forEach(move => moves.push(move));
            ChessMove.#generateMoves('knightRightDown', moveLimit, board, piece).forEach(move => moves.push(move));
        }

        if (movePattern.castle && !piece.hasMoved) {
            let kingSideRook = board.getPiece(piece.getRelativeRank(3), piece.file);
            let queenSideRook = board.getPiece(piece.getRelativeRank(-4), piece.file);

            if (kingSideRook?.movePattern.castle && !kingSideRook.hasMoved) {
                let kingSidePathIsClear =
                    board.squareIsEmpty(piece.getRelativeRank(1), piece.file) &&
                    board.squareIsEmpty(piece.getRelativeRank(2), piece.file) &&
                    !board.squareIsAttacked(piece.getRelativeRank(1), piece.file, piece.oppositeColor) &&
                    !board.squareIsAttacked(piece.getRelativeRank(2), piece.file, piece.oppositeColor);

                if (kingSidePathIsClear) moves.push({ rank: piece.getRelativeRank(2), file: piece.file });
            }

            if (queenSideRook?.movePattern.castle && !queenSideRook.hasMoved) {
                let queenSidePathIsClear =
                    board.squareIsEmpty(piece.getRelativeRank(-1), piece.file) &&
                    board.squareIsEmpty(piece.getRelativeRank(-2), piece.file) &&
                    board.squareIsEmpty(piece.getRelativeRank(-3), piece.file) &&
                    !board.squareIsAttacked(piece.getRelativeRank(-1), piece.file, piece.oppositeColor) &&
                    !board.squareIsAttacked(piece.getRelativeRank(-2), piece.file, piece.oppositeColor) &&
                    !board.squareIsAttacked(piece.getRelativeRank(-3), piece.file, piece.oppositeColor);

                if (queenSidePathIsClear) moves.push({ rank: piece.getRelativeRank(-2), file: piece.file });
            }

        }

        if (movePattern.avoidCheck && !captureOnly) {
            moves = moves.filter(move => !board.squareIsAttacked(move.rank, move.file, piece.oppositeColor));
        }

        if (!captureOnly) {
            let king = board.findPiece(ChessPiece.KING, piece.color);
            moves = moves.filter(move => {
                if (move.rank === undefined || move.file === undefined) return false;
                let boardCopy = board.copy();
                let pieceCopy = boardCopy.getPiece(piece.rank, piece.file);
                let kingCopy = boardCopy.findPiece(ChessPiece.KING, piece.color);
                
                if (boardCopy.getPiece(move.rank, move.file) !== null) boardCopy.capturePiece(move.rank, move.file);

                pieceCopy.moveTo(move.rank, move.file);

                move.value = piece.color === ChessPiece.WHITE ? board.blackScore - boardCopy.blackScore : board.whiteScore - boardCopy.whiteScore;
                move.piece = piece;
                
                return !boardCopy.squareIsAttacked(kingCopy.rank, kingCopy.file, kingCopy.oppositeColor);
            });
        }

        return moves;
    }
}