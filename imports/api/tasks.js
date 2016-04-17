import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

// MongoのCollectionを定義してる。Collectionは複数形にすることが多い。
export const Tasks = new Mongo.Collection('tasks');

// サーバ側だけこれする。
if (Meteor.isServer) {
  // publicのタスク、または、自分のタスク以外が引っかからないようにするpublishの設定
  Meteor.publish('tasks', function tasksPublication() {
    return Tasks.find({
      $or: [
        { private: { $ne: true } },
        { owner: this.userId },
      ],
    });
  });
}

// Meteor.methodsはサーバ/クライアントの両方で動く.
// つまり更新とかするとサーバ、クライアントのそれぞれのDBを同時に書き換えに行く。
// しかしクライアントのDBはHackされてる可能性があるので、サーバから書き戻しを行う。
Meteor.methods({
  'tasks.insert'(text) {
    // 引数チェックはこんな感じ
    check(text, String);

    // ログイン前に投稿できないように。
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.insert({
      text,
      createdAt: new Date(),
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
    });
  },
  'tasks.remove'(taskId) {
    check(taskId, String);

    const task = Tasks.findOne(taskId);
    // Privateで、自分のタスクでない場合は消せない
    if (task.private && task.owner !== this.userId) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error('not-authorized');
    }

    Tasks.remove(taskId);
  },
  'tasks.setChecked'(taskId, setChecked) {
    check(taskId, String);
    check(setChecked, Boolean);

    const task = Tasks.findOne(taskId);
    // Privateで、自分のタスクでない場合がチェックできない
    if (task.private && task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.update(taskId, { $set: { checked: setChecked } });
  },
  'tasks.setPrivate'(taskId, setToPrivate) {
    check(taskId, String);
    check(setToPrivate, Boolean);

    const task = Tasks.findOne(taskId);
    // 自分のタスク以外はprivate/publicを更新できない。
    if (task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  },
});
