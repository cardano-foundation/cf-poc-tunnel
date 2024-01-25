import { uid } from 'uid';

const isExpired = (date: string): boolean => {
  const dateObj = new Date(date);
  const currentDate = new Date();
  return dateObj < currentDate;
};

const getCurrentDate = (additionalMillis = 0) => {
  const now = new Date(Date.now() + additionalMillis);
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  const sec = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
};

const generateAID = async (): Promise<{ pubKey: string; privKey: string }> => {
  return {
    pubKey: uid(12),
    privKey: uid(12),
  };
};

const extractHostname= (url: string): string => {

  const regex = /^(?:https?:\/\/)?(?:[\w-]+\.)?([\w-]+\.[\w-]+(?:\:\d+)?)/;
  const matches = url.match(regex);

  return matches ? matches[1] : '';
}

const convertURLImageToBase64 = (url:string) => {
  return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });
}

export { isExpired, getCurrentDate, generateAID, extractHostname, convertURLImageToBase64 };
