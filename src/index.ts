import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the token from environment variables
const token: string = process.env.TELEGRAM_BOT_TOKEN || '';

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Interface for storing groups
interface Groups {
  [groupName: string]: string[];
}

// Storage for groups
const groups: Groups = {};

// Handle the /create_group command
bot.onText(/\/create_group (\$\w+) (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
  console.log('Creating group...');

  if (match) {
    const chatId = msg.chat.id;
    const groupName = match[1];
    const users = match[2].split(' ');

    if (groups[groupName]) {
      await bot.sendMessage(chatId, `Группа ${groupName} уже существует.`).catch(async (error) => {
        console.error('Error sending message:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при создании группы.');
      });
    } else {
      groups[groupName] = users;
      console.log(`Created group [${groupName}], chat [${chatId}], users [${users.join(', ')}]`);
      await bot.sendMessage(chatId, `Группа ${groupName} создана с пользователями: ${users.join(', ')}`).catch(async (error) => {
        console.error('Error sending message:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при создании группы.');
      });
    }
  }
});

// Handle the /mention_group command
bot.onText(/\/mention_group (\$\w+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
  console.log("Processing mention group...");

  if (match) {
    const chatId = msg.chat.id;
    const groupName = match[1];

    if (groups[groupName]) {
      const mentionMessage = groups[groupName].map(user => `@${user.replace('@', '')}`).join(' ');
      console.log(`Mentioning group [${groupName}] in chat [${chatId}] with message [${mentionMessage}]`);
      await bot.sendMessage(chatId, mentionMessage, { reply_to_message_id: msg.message_id }).catch(async (error) => {
        console.error('Error sending message:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при упоминании группы.');
      });
    } else {
      await bot.sendMessage(chatId, `Группа ${groupName} не найдена.`).catch(async (error) => {
        console.error('Error sending message:', error);
      });
    }
  }
});

// Handle the /delete_group command
bot.onText(/\/delete_group (\$\w+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
  console.log('Deleting group...');

  if (match) {
    const chatId = msg.chat.id;
    const groupName = match[1];

    if (groups[groupName]) {
      delete groups[groupName];
      console.log(`Deleted group [${groupName}], chat [${chatId}]`);
      await bot.sendMessage(chatId, `Группа ${groupName} удалена.`).catch(async (error) => {
        console.error('Error sending message:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при удалении группы.');
      });
    } else {
      await bot.sendMessage(chatId, `Группа ${groupName} не найдена.`).catch(async (error) => {
        console.error('Error sending message:', error);
      });
    }
  }
});

// Handle the /list_groups command
bot.onText(/\/list_groups/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;

  const groupNames = Object.keys(groups);
  if (groupNames.length > 0) {
    console.log(`Listing groups in chat [${chatId}]`);
    await bot.sendMessage(chatId, `Существующие группы: ${groupNames.join(', ')}`).catch(async (error) => {
      console.error('Error sending message:', error);
      await bot.sendMessage(chatId, 'Произошла ошибка при отображении списка групп.');
    });
  } else {
    await bot.sendMessage(chatId, 'Групп не найдено.').catch(async (error) => {
      console.error('Error sending message:', error);
    });
  }
});

// Handle the /help command
bot.onText(/\/help/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const helpMessage = `
Доступные команды:
/create_group $groupname @username1 @username2 ... - Создать группу с указанными пользователями.
/mention_group $groupname - Упомянуть всех пользователей в указанной группе.
/delete_group $groupname - Удалить указанную группу.
/list_groups - Показать все существующие группы.
/reply_to_thread - Создать новый топик с заголовком из указанного сообщения.
/help - Показать это сообщение.
  `;
  console.log(`Sending help message to chat [${chatId}]`);
  await bot.sendMessage(chatId, helpMessage).catch(async (error) => {
    console.error('Error sending message:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка при отображении справки.');
  });
});

// Handle the /reply_to_thread command
bot.onText(/\/reply_to_thread/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;

  if (msg.reply_to_message && msg.reply_to_message.text) {
    const title = msg.reply_to_message.text;
    try {
      const topic = await bot.createForumTopic(chatId, title);
      console.log(`Created new topic with title [${title}] in chat [${chatId}]`);
      await bot.sendMessage(chatId, `Создан новый топик с заголовком: "${title}"`);
    } catch (error) {
      console.error('Error creating topic:', error);
      await bot.sendMessage(chatId, 'Произошла ошибка при создании топика. Убедитесь, что бот имеет права администратора.');
    }
  } else {
    await bot.sendMessage(chatId, 'Используйте эту команду в ответ на сообщение.').catch(async (error) => {
      console.error('Error sending message:', error);
    });
  }
});

// Handle other messages
bot.on('message', (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  if (msg.text && msg.text.startsWith('/')) {
    console.log(`Handling command [${msg.text}] in chat [${chatId}]`);
    bot.sendMessage(chatId, 'Для получения списка доступных команд используйте /help.').catch((error) => {
      console.error('Error sending message:', error);
    });
  }
});
