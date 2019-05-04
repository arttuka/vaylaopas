create table lane (
  id int not null primary key,
  laneId int not null,
  depth double precision
);

create table coordinate (
  lane int not null references lane(id),
  index int not null,
  x double precision not null,
  y double precision not null,
  primary key (lane, index)
);

create table intersection (
  id serial primary key,
  x double precision not null,
  y double precision not null
);

create table lane_intersection (
  lane int not null references lane(id),
  intersection int not null references intersection(id),
  primary key (lane, intersection)
);
