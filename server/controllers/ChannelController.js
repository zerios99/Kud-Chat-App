import mongoose from "mongoose";
import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";

// createChannel
export const createChannel = async (request, response) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;

    const admin = await User.findById(userId);
    if (!admin) {
      return response.status(400).send("Admin user not found");
    }

    const validMembers = await User.find({ _id: { $in: members } });

    if (validMembers.length !== members.length) {
      return response.status(400).send("Some members are not valid users.");
    }

    const newChannel = new Channel({
      name,
      members,
      admin: userId,
    });

    await newChannel.save();
    response.status(201).json({ channel: newChannel });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Enternal Server Error");
  }
};

// getUserChannels
export const getUserChannels = async (request, response) => {
  try {
    const userId = new mongoose.Types.ObjectId(request.userId);
    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return response.status(201).json({ channels });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Enternal Server Error");
  }
};

// getChannelMessages
export const getChannelMessages = async (request, response) => {
  try {
    const { channelId } = request.params;
    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });
    if (!channel) {
      return response.status(404).send("Channel not found");
    }

    const messages = channel.messages;

    return response.status(201).json({ messages });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Enternal Server Error");
  }
};
