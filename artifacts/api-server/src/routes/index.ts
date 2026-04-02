import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import booksRouter from "./books";
import journalRouter from "./journal";
import { authMiddleware } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(authMiddleware);
router.use(booksRouter);
router.use(journalRouter);

export default router;
