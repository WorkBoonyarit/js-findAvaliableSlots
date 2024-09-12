input 

[
  {
    shiftSlots: [{ from: "08:30", to: "17:30" }],
    taskSlots: [
      { from: "09:12", to: "10:22" },
      { from: "11:50", to: "12:35" },
      { from: "13:00", to: "15:00" },
      { from: "16:49", to: "17:40" },
    ],
  },
]


output

[
  {
    "availableSlots": [
      {
        "from": "08:30",
        "to": "09:12"
      },
      {
        "from": "10:22",
        "to": "11:50"
      },
      {
        "from": "12:35",
        "to": "13:00"
      },
      {
        "from": "15:00",
        "to": "16:49"
      }
    ]
  }
]
