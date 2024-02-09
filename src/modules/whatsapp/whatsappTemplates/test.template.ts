export type bodyParams = {
  providerName: string;
  userName: string;
  unitsCount: string;
  product: string;
};

export const testTemplate = (
  templateName: string,
  recipientNumber: string,
  body: bodyParams,
) => {
  const requestBody = {
    messaging_product: 'whatsapp',
    to: recipientNumber,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'es_AR',
      },
      components: [
        {
          type: 'HEADER',
          parameters: [
            {
              type: 'image',
              image: {
                link: 'https://us.123rf.com/450wm/quartadis/quartadis1604/quartadis160400289/55933737-hombre-de-negocios-con-un-meg%C3%A1fono-importante-imagen-message-conceptual-de-un-personaje-de-hombre.jpg',
              },
            },
          ],
        },
        {
          type: 'BODY',
          parameters: [
            {
              type: 'text',
              text: body.providerName,
            },
            {
              type: 'text',
              text: body.userName,
            },
            {
              type: 'text',
              text: body.unitsCount,
            },
            {
              type: 'text',
              text: body.product,
            },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: '9rwnB8RbYmPF5t2Mn09x4h',
            },
          ],
        },
      ],
    },
  };

  return requestBody;
};
