const {
    whenWas,
    wait,
    mergeOldGuildData,
    abbreviateProgression,
    getProgFromAchi,
    getGuildProgression
} = require("../helpers");

const raids = require("../raids.json");

const oldGuildData = require("./data/apiResponses/oldGuildData.json");
const newGuildData = require("./data/apiResponses/newGuildData.json");
const progressionToAbbreviate = require("./data/apiResponses/progressionToAbbreviate.json");
const playerWithAchievements = require("./data/apiResponses/playerWithAchievements.json");
const guildListWithProg = require("./data/apiResponses/guildListWithProg.json");

describe("whenWas:", () => {
    describe("returns number:", () => {
        test("input 1", () => {
            expect(typeof whenWas(1)).toBe("number");
        });

        test("input: 100", () => {
            expect(typeof whenWas(100)).toBe("number");
        });
        test("input: -1", () => {
            expect(typeof whenWas(-1)).toBe("number");
        });
        test("input: -100", () => {
            expect(typeof whenWas(-1)).toBe("number");
        });
        test("input: 1.1", () => {
            expect(typeof whenWas(1.1)).toBe("number");
        });
    });

    describe("returns false:", () => {
        test("input: false", () => {
            expect(whenWas(false)).toBe(false);
        });
        test("input: true", () => {
            expect(whenWas(true)).toBe(false);
        });
        test('input: "string"', () => {
            expect(whenWas("string")).toBe(false);
        });
    });

    describe("value checks:", () => {
        let twoHoursEarlier = (new Date().getTime() - 1000 * 60 * 120) / 1000;
        let twoHoursLater = (new Date().getTime() + 1000 * 60 * 120) / 1000;
        test("input: two hours earlier returns 2", () => {
            expect(whenWas(twoHoursEarlier)).toBe(2);
        });
        test("input: two hours later returns -2", () => {
            expect(whenWas(twoHoursLater)).toBe(-2);
        });
        test("input: now returns 0", () => {
            expect(whenWas(new Date().getTime() / 1000)).toBe(0);
        });
    });
});

describe("wait:", () => {
    describe("throws error on invalid input type", () => {
        test("boolean", () => {
            try {
                wait(true);
            } catch (err) {
                expect(err).toBe("invalid input");
            }
        });
        test("string", () => {
            try {
                wait("string");
            } catch (err) {
                expect(err).toBe("invalid input");
            }
        });
    });

    test("pauses function successfully", async () => {
        const t1 = performance.now();
        await wait(2000);
        const t2 = performance.now();
        expect(t2 - t1 > 1000 && t2 - t1 < 3000).toBe(true);
    });
});

describe("merge old guild data:", () => {
    let newData = mergeOldGuildData(oldGuildData, newGuildData);
    describe("updates values properly", () => {
        test("from old guild data keeps the old value if needed", () => {
            expect(
                newData.progression["Throne of Thunder"][
                    "Heroic: Jin'rokh the Breaker"
                ]
            ).toBe(1);
        });

        test("from old guild data updates old value to the new value", () => {
            expect(
                newData.progression["Throne of Thunder"]["Heroic: Horridon"]
            ).toBe(1531947705);
        });

        test("from old guild data updates false to the new value", () => {
            expect(
                false !==
                    newData.progression["Terrace of the Endless Spring"][
                        "Heroic: Protectors of the Endless"
                    ]
            ).toBe(true);
        });

        test("if new guild data has false but old has value keeps old", () => {
            expect(
                newData.progression["Terrace of the Endless Spring"][
                    "Heroic: Tsulong"
                ]
            ).toBe(1507117435);
        });

        test("updates old abbreviations", () => {
            expect(
                newData.progression["Terrace of the Endless Spring"]
                    .abbreviation
            ).toBe("TOES 4/4 HC");
        });
    });
});

describe("abbreviate progression", () => {
    const abbriviatedProgression = abbreviateProgression(
        progressionToAbbreviate
    );

    test("abbreviates all instances", () => {
        let keyCounter = 0;
        let abbreviationCounter = 0;

        for (let key in progressionToAbbreviate) {
            keyCounter++;
        }

        for (let key in abbriviatedProgression) {
            if (abbriviatedProgression[key]) {
                abbreviationCounter++;
            }
        }

        expect(keyCounter === abbreviationCounter).toBe(true);
    });

    test("abbreviates tot", () => {
        expect(abbriviatedProgression["Throne of Thunder"].abbreviation).toBe(
            "TOT 13/13 HC"
        );
    });

    test("abbreviates toes", () => {
        expect(
            abbriviatedProgression["Terrace of the Endless Spring"].abbreviation
        ).toBe("TOES 3/4 HC");
    });

    test("abbreviates hof", () => {
        expect(abbriviatedProgression["Heart of Fear"].abbreviation).toBe(
            "HOF 6/6 HC"
        );
    });

    test("abbreviates msv", () => {
        expect(abbriviatedProgression["Mogu'shan Vaults"].abbreviation).toBe(
            "MSV 6/6 HC"
        );
    });
});

describe("get progression from achievements", () => {
    let progression = getProgFromAchi(playerWithAchievements);

    test("has all instances", () => {
        let isTrue = true;

        for (let instance in raids) {
            if (!progression[instance]) {
                isTrue = false;
            }
        }

        expect(isTrue).toBe(true);
    });

    test("msv", () => {
        expect(progression["Mogu'shan Vaults"].abbreviation).toBe("MSV 6/6 HC");
    });

    test("hof", () => {
        expect(progression["Heart of Fear"].abbreviation).toBe("HOF 6/6 HC");
    });

    test("toes", () => {
        expect(progression["Terrace of the Endless Spring"].abbreviation).toBe(
            "TOES 4/4 HC"
        );
    });

    test("tot", () => {
        expect(progression["Throne of Thunder"].abbreviation).toBe(
            "TOT 13/13 HC"
        );
    });
});

describe("get guild progression", () => {
    let progression = getGuildProgression(guildListWithProg);
    test("has all instances", () => {
        let isTrue = true;

        for (let instance in raids) {
            if (!progression[instance]) {
                isTrue = false;
            }
        }

        expect(isTrue).toBe(true);
    });

    test("msv", () => {
        expect(progression["Mogu'shan Vaults"].abbreviation).toBe("MSV 6/6 HC");
    });

    test("hof", () => {
        expect(progression["Heart of Fear"].abbreviation).toBe("HOF 6/6 HC");
    });

    test("toes", () => {
        expect(progression["Terrace of the Endless Spring"].abbreviation).toBe(
            "TOES 4/4 HC"
        );
    });

    test("tot", () => {
        expect(progression["Throne of Thunder"].abbreviation).toBe(
            "TOT 13/13 HC"
        );
    });
});
