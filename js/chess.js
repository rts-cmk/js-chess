import ChessBoard from "./chess-board.js";

let board = new ChessBoard();

document.body.appendChild(board.element);

setTimeout(() => board.aiOpponent = confirm("Do you want to play against the computer?"), 100);