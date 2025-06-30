const R = require("ramda");

const addMinutes = (time, mins) => {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(0, 0, 0, h, m + mins);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const buildAvailableSlots = async (slots) => {
  const staffSlots = [];
  for await (const slot of slots) {
    let availableSlots = slot.shiftSlots;
    const taskSlots = slot.taskSlots;

    if (taskSlots.length && availableSlots.length) {
      availableSlots = await compareSlots(availableSlots, taskSlots);
    }

    staffSlots.push({ availableSlots });
  }
  return staffSlots;
};

const compareSlots = async (availableSlots, excludeSlots) => {
  if (!availableSlots.length) return [];
  let shifts = R.sortBy(R.prop("from"), availableSlots);
  for (const excSlot of excludeSlots) {
    shifts = dispatchAvailableSlots(excSlot, shifts);
    if (!shifts.length) break;
  }
  return shifts;
};

const dispatchAvailableSlots = (excludeSlot, availableSlots) => {
  let shifts = [...availableSlots];
  for (let j = 0; j < shifts.length; j++) {
    const shift = shifts[j];
    const { from: sFrom, to: sTo } = shift;
    const { from: eFrom, to: eTo } = excludeSlot;

    // Overlap left
    if (eFrom < sFrom && eTo > sFrom && eTo <= sTo) {
      if (eTo >= sTo) {
        shifts.splice(j, 1);
        j--;
      } else {
        shifts[j].from = eTo;
      }
    }
    // Overlap right
    else if (eFrom >= sFrom && eFrom < sTo && eTo > sTo) {
      if (eFrom <= sFrom) {
        shifts.splice(j, 1);
        j--;
      } else {
        shifts[j].to = eFrom;
      }
    }
    // Inner overlap
    else if (eFrom > sFrom && eTo < sTo) {
      shifts.splice(j + 1, 0, { from: eTo, to: sTo });
      shifts[j].to = eFrom;
      break;
    }
    // Full overlap
    else if (
      (eFrom <= sFrom && eTo >= sTo) ||
      (eFrom === sFrom && eTo === sTo)
    ) {
      shifts.splice(j, 1);
      j--;
    }
  }
  return shifts;
};

// Example usage
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
