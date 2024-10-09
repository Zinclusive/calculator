const config = {
    "PeriodsPerYear": 12,
    "OrigFee": 75.00,
    "Apr": 59.975,
    "AprDropsTo": 35.975,
    "AprDropsOn": 13,
    "MinInitBal": 1000,

    "bands": [1000, 2000, 4000, 7000, 10000],

    "MinPmtPctPrin": [0, 5.5, 5.5, 5.25, 4.5],
    "MinPmtPctPrinBW": [0, 2.5384615384615383, 2.5384615384615383, 2.423076923076923, 2.076923076923077],
    "MinPmtPctPrinSM": [0, 2.75, 2.75, 2.625, 2.25],

    "MinPmtFloor": [0, 120, 125, 130, 150],
    "MinPmtFloorBW": [0, 55.38461538461539, 57.69230769230769, 60, 69.23076923076923],
    "MinPmtFloorSM": [0, 240, 250, 260, 300],

    "get_band": function (bal) {
        for (let i = 0; i < this.bands.length; i++) {
            if (bal < this.bands[i]) {
                return i;
            }
        }
        return this.bands.length - 1;
    }
};
config.MaxInitBal = Math.max(...config.bands);

export default config;