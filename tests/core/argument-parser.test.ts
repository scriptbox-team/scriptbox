import ArgumentParser from "core/argument-parser";

test("ArgumentParser::Parse Arguments::Standard Case", () => {
    const test = "nice spice mice";
    const args = ArgumentParser.parse(test);
    expect(args).toEqual(["nice", "spice", "mice"]);
});

test("ArgumentParser::Parse Arguments::Excessive Whitespace", () => {
    const test = "     this      is   a        whitespace   test    ";
    const args = ArgumentParser.parse(test);
    expect(args).toEqual(["this", "is", "a", "whitespace", "test"]);
});

test("ArgumentParser::Parse Arguments::Quotes and Spaces", () => {
    const test = "\"the quick\" brown fox \`jumped over\` the \'lazy dog?\'";
    const args = ArgumentParser.parse(test);
    expect(args).toEqual(["the quick", "brown", "fox", "jumped over", "the", "lazy dog?"]);
});

test("ArgumentParser::Parse Arguments::Empty String", () => {
    const test = "you can have an \"\" \`\` \'\' empty string!";
    const args = ArgumentParser.parse(test);
    expect(args).toEqual(["you", "can", "have", "an", "", "", "", "empty", "string!"]);
});

test("ArgumentParser::Parse Arguments::Escape Character", () => {
    const test = "this is \\\"a\\\" \\test \\\`\\for t\\he \'esc\\\'ape\' char";
    const args = ArgumentParser.parse(test);
    expect(args).toEqual(["this", "is", "\"a\"", "\\test", "\`\\for", "t\\he", "esc\'ape", "char"]);
});
