const user = undefined;
const name1 = user?.name || (user?.firstName + ' ' + (user?.lastName || '')) || 'Student';
console.log("name1:", name1);

const user2 = { firstName: "Aarav", lastName: "Sharma" };
const name2 = user2?.name || (user2?.firstName + ' ' + (user2?.lastName || '')) || 'Student';
console.log("name2:", name2);

const name3 = user?.name || (user?.firstName ? user.firstName + ' ' + (user.lastName || '') : 'Student');
console.log("name3:", name3);
