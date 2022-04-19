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


--- AVALANCE 

CREATE TABLE pairs_awax
(
    id  bigserial constraint pair_awax_pk primary key,
    exchange_name varchar(20),
    token0 varchar(43),
    token1 varchar(43),    
    token0_symbol varchar(50),
    token1_symbol varchar(50),
    pair varchar(43),
    fee integer
);

alter table pairs_awax owner to postgres;

alter table pairs_awax
	add pangolin varchar(43) default '0x0000000000000000000000000000000000000000';



-- alter table pairs
-- 	add uniswap_v2 varchar(43) default '0x0000000000000000000000000000000000000000';

-- alter table pairs
-- 	add sushiswap_v2 varchar(43) default '0x0000000000000000000000000000000000000000'::character varying;

