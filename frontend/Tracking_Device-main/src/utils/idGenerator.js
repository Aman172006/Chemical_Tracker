import { nanoid } from 'nanoid';

export const generateClientId = () => {
    return `CLT-${nanoid(6).toUpperCase().replace(/[^A-Z0-0]/g, 'X')}`;
};

export const generateUrnNumber = () => {
    return `URN-${nanoid(10).toUpperCase()}`;
};
