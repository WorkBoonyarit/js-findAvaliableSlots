const R = require("ramda");

const buildAvailableSlots = async (slots) => {
  const staffSlots = [];
  for await (const slot of slots) {
    let availableSlots = slot.shiftSlots;
    let taskSlots = slot.taskSlots;

    if (taskSlots.length > 0 && availableSlots.length) {
      availableSlots = await compareSlots(availableSlots, taskSlots);
    }

    staffSlots.push({
      availableSlots,
    });
  }
  return staffSlots;
};

const compareSlots = async (availableSlots, excludeSlots) => {
  if (!availableSlots.length) return [];
  const sortWithFrom = R.sortWith([R.ascend(R.prop("from"))]);
  let shifts = sortWithFrom(availableSlots);
  for (const excSlots of excludeSlots) {
    shifts = dispatchAvailableSlots(excSlots, R.flatten(shifts));
    if (!shifts.length) break;
  }
  return shifts;
};

const isLastShifts = (index, shift) => {
  return index == shift;
};

const dispatchAvailableSlots = (excludeSlot, availableSlots) => {
  let shifts = availableSlots;
  for (let j = 0; j < shifts.length; j++) {
    if (
      (excludeSlot.from < shifts[j].from &&
        excludeSlot.from < shifts[j].to &&
        excludeSlot.to > shifts[j].from &&
        excludeSlot.to <= shifts[j].to) ||
      (excludeSlot.from == shifts[j].from &&
        excludeSlot.from < shifts[j].to &&
        excludeSlot.to > shifts[j].from &&
        excludeSlot.to < shifts[j].to)
    ) {
      //left join
      if (excludeSlot.to >= shifts[j].to) {
        shifts.splice(j, 1);
        if (isLastShifts(j, shifts.length)) return shifts;
        j -= 1;
      } else {
        shifts[j].from = excludeSlot.to;
        if (isLastShifts(j, shifts.length - 1)) return shifts;
      }
    } else if (
      (excludeSlot.from >= shifts[j].from &&
        excludeSlot.from < shifts[j].to &&
        excludeSlot.to > shifts[j].from &&
        excludeSlot.to > shifts[j].to) ||
      (excludeSlot.from > shifts[j].from &&
        excludeSlot.from < shifts[j].to &&
        excludeSlot.to > shifts[j].from &&
        excludeSlot.to == shifts[j].to)
    ) {
      //right join
      if (excludeSlot.from <= shifts[j].from) {
        shifts.splice(j, 1);
        if (isLastShifts(j, shifts.length)) return shifts;
        j -= 1;
      } else {
        shifts[j].to = excludeSlot.from;
        if (isLastShifts(j, shifts.length - 1)) return shifts;
      }
    } else if (
      excludeSlot.from > shifts[j].from &&
      excludeSlot.from < shifts[j].to &&
      excludeSlot.to > shifts[j].from &&
      excludeSlot.to < shifts[j].to
    ) {
      //inner join
      shifts.splice(j + 1, 0, {
        from: excludeSlot.to,
        to: shifts[j].to,
      });
      shifts[j].to = excludeSlot.from;
      if (isLastShifts(j, shifts.length - 1)) return shifts;
    } else if (
      (excludeSlot.from < shifts[j].from && excludeSlot.to > shifts[j].to) ||
      (excludeSlot.from == shifts[j].from && excludeSlot.to == shifts[j].to)
    ) {
      // full join
      shifts.splice(j, 1);
      if (isLastShifts(j, shifts.length)) return shifts;
      j -= 1;
    } else if (isLastShifts(j, shifts.length - 1)) return shifts;
  }
};
const result1 = buildAvailableSlots([
  {
    shiftSlots: [{ from: "08:30", to: "17:30" }],
    taskSlots: [{ from: "13:00", to: "15:00" }],
  },
]);
const result2 = buildAvailableSlots([
  {
    shiftSlots: [{ from: "08:30", to: "17:30" }],
    taskSlots: [
      { from: "09:12", to: "10:22" },
      { from: "11:50", to: "12:35" },
      { from: "13:00", to: "15:00" },
      { from: "16:49", to: "17:40" },
    ],
  },
]);
const result3 = buildAvailableSlots([
  {
    shiftSlots: [{ from: "08:30", to: "17:30" }],
    taskSlots: [{ from: "08:00", to: "17:40" }],
  },
]);
const result4 = buildAvailableSlots([
  {
    shiftSlots: [{ from: "08:30", to: "17:30" }],
    taskSlots: [{ from: "08:00", to: "17:29" }],
  },
]);

Promise.all([result1, result2, result3, result4]).then((result) => {
  console.log("result1", JSON.stringify(result[0], null, 2));
  console.log("result2", JSON.stringify(result[1], null, 2));
  console.log("result3", JSON.stringify(result[2], null, 2));
  console.log("result4", JSON.stringify(result[3], null, 2));
});
