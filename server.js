import app from './app.js'
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = 8080;

app.listen(process.env.PORT || PORT, () => console.log(`server started`));
