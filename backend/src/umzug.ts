import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './config/database';
import path from 'path';

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, 'migrations/*.{ts,js}'),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export default umzug;
