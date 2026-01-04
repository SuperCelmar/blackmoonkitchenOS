import { MenuItem, Category, Table } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    code: 'E01',
    nameFR: 'Gyoza Poulet',
    nameCN: '鸡肉煎饺',
    descriptionFR: 'Raviolis grillés au poulet et légumes (5 pièces)',
    price: 6.50,
    category: Category.STARTER,
    image: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: '2',
    code: 'E02',
    nameFR: 'Salade de Concombre',
    nameCN: '拍黄瓜',
    descriptionFR: 'Concombres écrasés à l\'ail et huile pimentée',
    price: 5.00,
    category: Category.STARTER,
    image: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: '3',
    code: 'P01',
    nameFR: 'Nouilles au Bœuf Braisé',
    nameCN: '红烧牛肉面',
    descriptionFR: 'Soupe de nouilles artisanales, bœuf mijoté 4h, bok choy',
    price: 13.50,
    category: Category.MAIN,
    image: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: '4',
    code: 'P02',
    nameFR: 'Dan Dan Mian',
    nameCN: '担担面',
    descriptionFR: 'Nouilles sèches sauce sésame et porc haché épicé',
    price: 12.00,
    category: Category.MAIN,
    image: 'https://picsum.photos/200/200?random=4'
  },
  {
    id: '5',
    code: 'D01',
    nameFR: 'Mochi Glacé Thé Vert',
    nameCN: '抹茶大福',
    descriptionFR: 'Boule de riz gluant fourrée à la glace thé vert',
    price: 4.50,
    category: Category.DESSERT,
    image: 'https://picsum.photos/200/200?random=5'
  },
];

export const INITIAL_TABLES: Table[] = [
  { id: '1', label: '1', x: 50, y: 50, type: 'RECT', capacity: 4 },
  { id: '2', label: '2', x: 200, y: 50, type: 'RECT', capacity: 2 },
  { id: '3', label: '3', x: 50, y: 200, type: 'RECT', capacity: 6 },
  { id: '4', label: '4', x: 200, y: 200, type: 'RECT', capacity: 4 },
  { id: '5', label: '5', x: 350, y: 125, type: 'RECT', capacity: 2 },
];