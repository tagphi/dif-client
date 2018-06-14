

describe("dewa",function () {
    it("fjdhsb", function () {
        let date = new Date();

       let dateStr= date.setDate(date.getDate() - 1).toString();


        let startTimestamp = date.getTime().toString();

        date.setDate(date.getDate() + 2);
        let endTimestamp = date.getTime().toString();
    });
});