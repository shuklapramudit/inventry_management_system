USE chashma_plus_inventory_new;

INSERT INTO admins
    (email, password_hash, name)
VALUES
    (
        'admin@chashmaplus.in',
        '$2b$10$REPLACE_WITH_BCRYPT_HASH',
        'Chashma Plus Admin'
    );