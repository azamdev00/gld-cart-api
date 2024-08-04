import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMessageDto } from '@chat/dto/create-message.dto';
import { Message, MessageDocument } from '@chat/schemas/message.schema';

@Injectable()
export class MessageService {
  public constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) { }

  public async createMessage(message: CreateMessageDto): Promise<Message> {
    return this.messageModel.create(message);
  }

  public async getChatMessages(chatId: string): Promise<Message[]> {
    return this.messageModel.find({ chat: chatId }).lean();
  }
}