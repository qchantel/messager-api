export const AIHelpers = {
  buildChatMessage: function (msg) {
    return msg.map((elem) => {
      return {
        role: elem.role,
        content: elem.content.replace(/\{\{\s*[a-z0-9]{1,}\s*\}\}/g, (sub) => {
          if (elem.vars) {
            return elem.vars[sub.slice(2, -2).trim()]?.toString() ?? "";
          }
        }),
      };
    });
  },
};
