const express = require("express")
const http = require("http")
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const server = http.createServer(app)
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
})
// Server static assets 
app.all('*', function (req, res, next) {
	if (!req.get('Origin')) return next();
	res.set('Access-Control-Allow-Origin', '*');
	res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
	res.set('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,x-auth-token,x-api-key');
	next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Conect to DB
const mongoCon = require("./dbs_connected/mongo_connected");

//Routs Middlewares
const usersRouter = require('./routes/users');
app.use('/api', usersRouter);

app.get('/', (req, res) => {
	res.send('Running');
});

//Routes Chat connection
io.on("connection", (socket) => {
	socket.emit("me", socket.id)

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
