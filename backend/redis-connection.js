import {Redis} from 'ioredis';

export const connection = new Redis(6379,'redis',{maxRetriesPerRequest:null});
