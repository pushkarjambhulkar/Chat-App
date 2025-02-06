const express = require('express')
const { Server } = require('socket.io')
const http  = require('http')
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken')
const UserModel = require('../models/UserModel')
const { ConversationModel,MessageModel } = require('../models/ConversationModel')
const getConversation = require('../helpers/getConversation')

const app = express()

/***socket connection */
const server = http.createServer(app)
const io = new Server(server,{
    cors : {
        origin : process.env.FRONTEND_URL,
        credentials : true
    }
})



//online user
const onlineUser = new Set()

io.on('connection', async (socket) => {
    console.log("Connected User:", socket.id);

    try {
        const token = socket.handshake.auth.token;

        // Fetch current user details
        const user = await getUserDetailsFromToken(token);
        if (!user) {
            throw new Error("User not found");
        }

        // Create a room for the user
        socket.join(user._id.toString());
        onlineUser.add(user._id.toString());

        // Emit online users to all clients
        io.emit('onlineUser', Array.from(onlineUser));

        // Handle message page request
        socket.on('message-page', async (userId) => {
            try {
                const userDetails = await UserModel.findById(userId).select("-password");
                if (!userDetails) {
                    throw new Error("User details not found");
                }

                const payload = {
                    _id: userDetails._id,
                    name: userDetails.name,
                    email: userDetails.email,
                    profile_pic: userDetails.profile_pic,
                    online: onlineUser.has(userId),
                };
                socket.emit('message-user', payload);

                // Fetch previous messages
                const getConversationMessage = await ConversationModel.findOne({
                    "$or": [
                        { sender: user._id, receiver: userId },
                        { sender: userId, receiver: user._id },
                    ],
                }).populate('messages').sort({ updatedAt: -1 });

                socket.emit('message', getConversationMessage?.messages || []);
            } catch (error) {
                console.error("Error in message-page:", error);
                socket.emit('error', { message: "Failed to fetch user details or messages" });
            }
        });

        // Handle new message
        socket.on('new message', async (data) => {
            try {
                // Check if conversation exists
                let conversation = await ConversationModel.findOne({
                    "$or": [
                        { sender: data.sender, receiver: data.receiver },
                        { sender: data.receiver, receiver: data.sender },
                    ],
                });

                // Create conversation if it doesn't exist
                if (!conversation) {
                    conversation = await ConversationModel.create({
                        sender: data.sender,
                        receiver: data.receiver,
                    });
                }

                // Save the new message
                const message = await MessageModel.create({
                    text: data.text,
                    imageUrl: data.imageUrl,
                    videoUrl: data.videoUrl,
                    msgByUserId: data.msgByUserId,
                });

                // Update conversation with the new message
                await ConversationModel.updateOne(
                    { _id: conversation._id },
                    { $push: { messages: message._id } }
                );

                // Fetch updated conversation messages
                const getConversationMessage = await ConversationModel.findOne({
                    "$or": [
                        { sender: data.sender, receiver: data.receiver },
                        { sender: data.receiver, receiver: data.sender },
                    ],
                }).populate('messages').sort({ updatedAt: -1 });

                // Emit messages to both sender and receiver
                io.to(data.sender).emit('message', getConversationMessage?.messages || []);
                io.to(data.receiver).emit('message', getConversationMessage?.messages || []);

                // Fetch and emit updated conversations
                const conversationSender = await getConversation(data.sender);
                const conversationReceiver = await getConversation(data.receiver);

                io.to(data.sender).emit('conversation', conversationSender);
                io.to(data.receiver).emit('conversation', conversationReceiver);
            } catch (error) {
                console.error("Error in new message:", error);
                socket.emit('error', { message: "Failed to send message" });
            }
        });

        // Handle sidebar request
        socket.on('sidebar', async (currentUserId) => {
            try {
                const conversation = await getConversation(currentUserId);
                socket.emit('conversation', conversation);
            } catch (error) {
                console.error("Error in sidebar:", error);
                socket.emit('error', { message: "Failed to fetch conversations" });
            }
        });

        // Handle seen messages
        socket.on('seen', async (msgByUserId) => {
            try {
                const conversation = await ConversationModel.findOne({
                    "$or": [
                        { sender: user._id, receiver: msgByUserId },
                        { sender: msgByUserId, receiver: user._id },
                    ],
                });

                if (conversation) {
                    await MessageModel.updateMany(
                        { _id: { $in: conversation.messages }, msgByUserId: msgByUserId },
                        { $set: { seen: true } }
                    );

                    // Fetch and emit updated conversations
                    const conversationSender = await getConversation(user._id.toString());
                    const conversationReceiver = await getConversation(msgByUserId);

                    io.to(user._id.toString()).emit('conversation', conversationSender);
                    io.to(msgByUserId).emit('conversation', conversationReceiver);
                }
            } catch (error) {
                console.error("Error in seen:", error);
                socket.emit('error', { message: "Failed to update seen status" });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            onlineUser.delete(user._id.toString());
            console.log('Disconnected User:', socket.id);
            io.emit('onlineUser', Array.from(onlineUser)); // Update online users list
        });
    } catch (error) {
        console.error("Error in connection:", error);
        socket.emit('error', { message: "Connection error" });
    }
});

module.exports = {
    app,
    server
}
