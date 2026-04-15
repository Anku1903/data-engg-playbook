var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
var FILENAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;
var CATEGORY_SLUGS = new Set([
    "python",
    "sql",
    "pyspark",
    "databricks",
    "azure-data-factory",
    "azure-functions",
    "azure-synapse",
    "dbt",
    "airflow",
    "terraform",
    "docker",
    "kubernetes",
    "azure-devops",
]);
function send(res, status, body) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
}
function readJson(req) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var chunks = [];
                    req.on("data", function (c) { return chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); });
                    req.on("end", function () {
                        try {
                            var raw = Buffer.concat(chunks).toString("utf8");
                            resolve(raw ? JSON.parse(raw) : {});
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                    req.on("error", reject);
                })];
        });
    });
}
export default function uploadPlugin() {
    return {
        name: "data-engg-playbook:upload",
        apply: "serve",
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use("/__upload", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var body, e_1, category, filename, contents, parsed, fm, required, missing, fileSlug, targetDir, targetPath, _a, e_2, err;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (req.method !== "POST") {
                                next();
                                return [2 /*return*/];
                            }
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, readJson(req)];
                        case 2:
                            body = _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _b.sent();
                            send(res, 400, { ok: false, error: "Invalid JSON body: ".concat(e_1.message) });
                            return [2 /*return*/];
                        case 4:
                            category = typeof body.category === "string" ? body.category : "";
                            filename = typeof body.filename === "string" ? body.filename : "";
                            contents = typeof body.contents === "string" ? body.contents : "";
                            if (!category || !filename || !contents) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Missing required fields: category, filename, contents",
                                });
                                return [2 /*return*/];
                            }
                            if (!CATEGORY_SLUGS.has(category)) {
                                send(res, 400, { ok: false, error: "Unknown category \"".concat(category, "\"") });
                                return [2 /*return*/];
                            }
                            if (!FILENAME_RE.test(filename)) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Filename must be lowercase kebab-case, e.g. `window-functions.md`",
                                });
                                return [2 /*return*/];
                            }
                            try {
                                parsed = matter(contents);
                            }
                            catch (e) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Could not parse frontmatter: ".concat(e.message),
                                });
                                return [2 /*return*/];
                            }
                            fm = parsed.data;
                            required = ["title", "category", "subcategory", "tags", "updated"];
                            missing = required.filter(function (k) { return fm[k] === undefined || fm[k] === null || fm[k] === ""; });
                            if (missing.length > 0) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Frontmatter missing required fields: ".concat(missing.join(", ")),
                                });
                                return [2 /*return*/];
                            }
                            if (!Array.isArray(fm.tags)) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Frontmatter `tags` must be a YAML list",
                                });
                                return [2 /*return*/];
                            }
                            fileSlug = filename.replace(/\.md$/, "");
                            if (fm.category !== category) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Frontmatter category \"".concat(String(fm.category), "\" does not match selected category \"").concat(category, "\""),
                                });
                                return [2 /*return*/];
                            }
                            if (fm.subcategory !== fileSlug) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Frontmatter subcategory \"".concat(String(fm.subcategory), "\" does not match filename \"").concat(fileSlug, "\""),
                                });
                                return [2 /*return*/];
                            }
                            targetDir = path.resolve(server.config.root, "src", "content", category);
                            targetPath = path.join(targetDir, filename);
                            _b.label = 5;
                        case 5:
                            _b.trys.push([5, 12, , 13]);
                            return [4 /*yield*/, fs.mkdir(targetDir, { recursive: true })];
                        case 6:
                            _b.sent();
                            _b.label = 7;
                        case 7:
                            _b.trys.push([7, 9, , 10]);
                            return [4 /*yield*/, fs.access(targetPath)];
                        case 8:
                            _b.sent();
                            send(res, 409, {
                                ok: false,
                                error: "A file with this name already exists in ".concat(category),
                            });
                            return [2 /*return*/];
                        case 9:
                            _a = _b.sent();
                            return [3 /*break*/, 10];
                        case 10: return [4 /*yield*/, fs.writeFile(targetPath, contents, { encoding: "utf8", flag: "wx" })];
                        case 11:
                            _b.sent();
                            return [3 /*break*/, 13];
                        case 12:
                            e_2 = _b.sent();
                            err = e_2;
                            if (err.code === "EEXIST") {
                                send(res, 409, {
                                    ok: false,
                                    error: "A file with this name already exists in ".concat(category),
                                });
                                return [2 /*return*/];
                            }
                            send(res, 500, { ok: false, error: "Write failed: ".concat(err.message) });
                            return [2 /*return*/];
                        case 13:
                            send(res, 200, {
                                ok: true,
                                path: "/src/content/".concat(category, "/").concat(filename),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            // Delete endpoint — removes a file under src/content/<category>/.
            // Validates category + filename and guards against path traversal.
            server.middlewares.use("/__delete", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var body, e_3, category, filename, contentRoot, expectedDir, targetPath, e_4, err;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (req.method !== "POST") {
                                next();
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, readJson(req)];
                        case 2:
                            body = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_3 = _a.sent();
                            send(res, 400, { ok: false, error: "Invalid JSON body: ".concat(e_3.message) });
                            return [2 /*return*/];
                        case 4:
                            category = typeof body.category === "string" ? body.category : "";
                            filename = typeof body.filename === "string" ? body.filename : "";
                            if (!category || !filename) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Missing required fields: category, filename",
                                });
                                return [2 /*return*/];
                            }
                            if (!CATEGORY_SLUGS.has(category)) {
                                send(res, 400, { ok: false, error: "Unknown category \"".concat(category, "\"") });
                                return [2 /*return*/];
                            }
                            if (!FILENAME_RE.test(filename)) {
                                send(res, 400, {
                                    ok: false,
                                    error: "Filename must be lowercase kebab-case, e.g. `window-functions.md`",
                                });
                                return [2 /*return*/];
                            }
                            contentRoot = path.resolve(server.config.root, "src", "content");
                            expectedDir = path.resolve(contentRoot, category);
                            targetPath = path.resolve(expectedDir, filename);
                            // Path-traversal guard: resolved path must be inside the expected dir.
                            if (!targetPath.startsWith(expectedDir + path.sep) &&
                                targetPath !== expectedDir) {
                                send(res, 400, { ok: false, error: "Invalid path" });
                                return [2 /*return*/];
                            }
                            _a.label = 5;
                        case 5:
                            _a.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, fs.unlink(targetPath)];
                        case 6:
                            _a.sent();
                            return [3 /*break*/, 8];
                        case 7:
                            e_4 = _a.sent();
                            err = e_4;
                            if (err.code === "ENOENT") {
                                send(res, 404, { ok: false, error: "File not found" });
                                return [2 /*return*/];
                            }
                            send(res, 500, { ok: false, error: "Delete failed: ".concat(err.message) });
                            return [2 /*return*/];
                        case 8:
                            send(res, 200, {
                                ok: true,
                                path: "/src/content/".concat(category, "/").concat(filename),
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
        },
    };
}
