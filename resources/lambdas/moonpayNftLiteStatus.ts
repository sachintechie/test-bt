export const handler = async (event: any, context: any) => {
  const { id } = event;
  console.log("id:", id);
  return [
    [
      {
        data: {
          id: id,
          status: "completed",
          transactionHash: ["0x8e941692058bde327a2c6b1d1d0c10ccd725a058b1ada980981df5dde18573c0"],
          statusChangedAt: "2024-09-25T18:04:00.582Z",
          tokenId: ["37"]
        }
      }
    ]
  ];
};
