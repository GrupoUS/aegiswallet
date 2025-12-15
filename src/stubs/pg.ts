export class Pool {
  constructor() {
    throw new Error('pg cannot be used in browser context');
  }
}

export class Client {
  constructor() {
    throw new Error('pg cannot be used in browser context');
  }
}

export const neon = () => {
  throw new Error('neon cannot be used in browser context');
};

export default { Pool, Client };
