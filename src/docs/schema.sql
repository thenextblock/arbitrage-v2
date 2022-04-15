DROP table pairs;
CREATE TABLE pairs
(
    id  bigserial constraint pair_pk primary key,
    exchange_name varchar(20),
    token0 varchar(43),
    token1 varchar(43),    
    token0_symbol varchar(50),
    token1_symbol varchar(50),
    pair varchar(43),
    fee integer
);

alter table pairs owner to postgres;