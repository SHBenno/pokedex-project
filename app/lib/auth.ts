import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";


export const auth = betterAuth({
  database: createPool({
    database: process.env.DBNAME,
    password: process.env.DBPASSWORD,
    user: process.env.DBUSERNAME,
    host: process.env.DBHOST,
  }),
  emailAndPassword: {
    enabled: true
  },
  user: {
    additionalFields: {
      favourites: {
        type: "number[]",
        required: true,
        defaultValue: "[]"
      }
    }
  }
})