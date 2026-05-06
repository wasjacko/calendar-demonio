-- Migration : ajoute le type combiné AUDIENCE_VALEUR
-- Format hybride : donne de la valeur ET fait du volume de vues
-- Utilisé dans les Salves comme alternative à AUDIENCE seule ou VALEUR seule

alter type content_type_bara add value if not exists 'AUDIENCE_VALEUR';

select 'Type AUDIENCE_VALEUR ajouté à content_type_bara';
