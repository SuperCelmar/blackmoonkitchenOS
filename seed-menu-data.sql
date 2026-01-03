-- Seed Categories
INSERT INTO categories (name_fr, name_en, slug, display_order) VALUES
('Entrées', 'Starters', 'entrees', 1),
('Salades', 'Salads', 'salades', 2),
('Pho', 'Pho', 'pho', 3),
('Udon', 'Udon', 'udon', 4),
('Bols de riz blanc', 'White Rice Bowls', 'bols-riz-blanc', 5),
('Riz', 'Rice', 'riz', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed Menu Items - Entrées
INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'E8', 'Gyoza aux légumes', NULL, 'Raviolis japonais grillés aux légumes de saison (4 pièces)', 5.50,
  (SELECT id FROM categories WHERE slug = 'entrees'), false, true, 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'E9', 'Raviolis crevettes', NULL, 'Ha Kao traditionnels à la vapeur (4 pièces)', 6.20,
  (SELECT id FROM categories WHERE slug = 'entrees'), false, true, 2
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'E10', 'Bouchées aux crevettes', NULL, 'Chinese shrimp dumplings (4 pièces)', 6.20,
  (SELECT id FROM categories WHERE slug = 'entrees'), false, true, 3
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'E11', 'Brioche au porc laqué', NULL, 'Chinese pork buns', 4.50,
  (SELECT id FROM categories WHERE slug = 'entrees'), false, true, 4
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'E12', 'Raviolis de Shanghai au porc', NULL, 'Shanghai pork dumplings (4 pièces)', 6.20,
  (SELECT id FROM categories WHERE slug = 'entrees'), false, true, 5
ON CONFLICT (code) DO NOTHING;

-- Seed Menu Items - Salades
INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'SA1', 'Salade de bœuf sautée à la sauce poisson', NULL, 'Sautéed beef salad with fish sauce', 9.50,
  (SELECT id FROM categories WHERE slug = 'salades'), false, true, 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'SA2', 'Salade aux crevettes', NULL, 'Salad with shrimp', 10.50,
  (SELECT id FROM categories WHERE slug = 'salades'), false, true, 2
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'SA3', 'Salade au poulet croustillant', NULL, 'Crispy chicken salad', 9.50,
  (SELECT id FROM categories WHERE slug = 'salades'), false, true, 3
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'SA4', 'Salade aux algues', NULL, 'Seaweed salad', 8.50,
  (SELECT id FROM categories WHERE slug = 'salades'), false, true, 4
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'SA5', 'Salade de tempura aux crevettes', NULL, 'Shrimp tempura salad', 10.50,
  (SELECT id FROM categories WHERE slug = 'salades'), false, true, 5
ON CONFLICT (code) DO NOTHING;

-- Seed Menu Items - Pho
INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'S14G', 'Pho spécial grand', NULL, 'Pho special large', 14.50,
  (SELECT id FROM categories WHERE slug = 'pho'), false, true, 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'S14P', 'Pho spécial petit', NULL, 'Pho special small', 12.50,
  (SELECT id FROM categories WHERE slug = 'pho'), false, true, 2
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'S15', 'Pho aux boulettes de bœuf', NULL, 'Pho with beef meatballs', 12.90,
  (SELECT id FROM categories WHERE slug = 'pho'), false, true, 3
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'S16', 'Pho ragoût de bœuf', NULL, 'Pho with beef ragout', 14.50,
  (SELECT id FROM categories WHERE slug = 'pho'), false, true, 4
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'S17', 'Pho à la côte de porc en ragoût', NULL, 'Pho with pork ribs in ragout', 13.90,
  (SELECT id FROM categories WHERE slug = 'pho'), false, true, 5
ON CONFLICT (code) DO NOTHING;

-- Seed Menu Items - Udon
INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'U1', 'Soupe udon aux côtes de porc en ragoût', NULL, 'Udon noodle soup with pork ribs', 13.90,
  (SELECT id FROM categories WHERE slug = 'udon'), false, true, 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'U2', 'Soupe udon au porc laqué', NULL, 'Udon noodle soup with glazed pork', 13.90,
  (SELECT id FROM categories WHERE slug = 'udon'), false, true, 2
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'U3', 'Soupe udon aux boulettes de poulet', NULL, 'Udon noodle soup with chicken meatballs', 12.90,
  (SELECT id FROM categories WHERE slug = 'udon'), false, true, 3
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'U4', 'Soupe udon au ragoût de bœuf', NULL, 'Udon noodle soup with beef ragout', 14.90,
  (SELECT id FROM categories WHERE slug = 'udon'), false, true, 4
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'U5', 'Soupe udon au bœuf braisé', NULL, 'Udon noodle soup with braised beef', 13.90,
  (SELECT id FROM categories WHERE slug = 'udon'), false, true, 5
ON CONFLICT (code) DO NOTHING;

-- Seed Menu Items - Bols de riz blanc
INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B1', 'Bol de riz blanc aux côtes de porc en ragoût', NULL, 'Rice bowl with pork ribs in ragout', 14.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B2', 'Bol de riz blanc au porc laqué', NULL, 'Rice bowl with glazed pork', 13.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 2
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B3', 'Bol de riz blanc au poulet croustillant', NULL, 'Rice bowl with crispy chicken', 13.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 3
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B4', 'Bol de riz blanc aux boulettes de poulet', NULL, 'Rice bowl with chicken meatballs', 12.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 4
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B5', 'Bol de riz blanc au ragoût de bœuf', NULL, 'Rice bowl with beef ragout', 13.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 5
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B6', 'Bol de riz blanc au canard laqué', NULL, 'Rice bowl with roasted duck', 14.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 6
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B7', 'Bol de riz blanc aux crevettes à la sauce piquante', NULL, 'Rice bowl with shrimp in spicy sauce', 14.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 7
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B8', 'Bol de riz végétarien', NULL, 'Rice bowl vegetarian', 11.90,
  (SELECT id FROM categories WHERE slug = 'bols-riz-blanc'), false, true, 8
ON CONFLICT (code) DO NOTHING;

-- Seed Menu Items - Riz
INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B9', 'Riz au bœuf loc lac', NULL, 'Rice with bu loc lac (1 organic egg in supplement +1.50€)', 14.90,
  (SELECT id FROM categories WHERE slug = 'riz'), false, true, 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B10', 'Riz Cantonais', NULL, 'Fried rice', 8.90,
  (SELECT id FROM categories WHERE slug = 'riz'), false, true, 2
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B11', 'Riz sauté aux crevettes', NULL, 'Fried rice with shrimps', 12.90,
  (SELECT id FROM categories WHERE slug = 'riz'), false, true, 3
ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (code, name_fr, name_cn, description_fr, price, category_id, is_popular, is_available, display_order) 
SELECT 
  'B12', 'Riz nature', NULL, 'Plain rice', 2.50,
  (SELECT id FROM categories WHERE slug = 'riz'), false, true, 4
ON CONFLICT (code) DO NOTHING;

