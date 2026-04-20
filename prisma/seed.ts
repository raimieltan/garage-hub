import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/garage_hub";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding GarageHub database...");

  // ------------------------------------------------------------------
  // Clean existing data (order respects FK constraints)
  // ------------------------------------------------------------------
  await prisma.rSVP.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // ------------------------------------------------------------------
  // Users
  // ------------------------------------------------------------------
  const [mike, sarah, carlos, priya, jake] = await Promise.all([
    prisma.user.create({
      data: {
        email: "mike@garagehub.dev",
        username: "turbo_mike",
        passwordHash,
        displayName: "Turbo Mike",
        bio: "Boosted builds only. Supra owner. Track rat on weekends.",
        avatarUrl: "https://i.pravatar.cc/150?u=turbo_mike",
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah@garagehub.dev",
        username: "jdm_sarah",
        passwordHash,
        displayName: "JDM Sarah",
        bio: "240SX drift builds, JDM imports, and too much Initial D.",
        avatarUrl: "https://i.pravatar.cc/150?u=jdm_sarah",
      },
    }),
    prisma.user.create({
      data: {
        email: "carlos@garagehub.dev",
        username: "v8thunder",
        passwordHash,
        displayName: "Carlos V8",
        bio: "American muscle runs through my veins. Mustang + Camaro guy.",
        avatarUrl: "https://i.pravatar.cc/150?u=v8thunder",
      },
    }),
    prisma.user.create({
      data: {
        email: "priya@garagehub.dev",
        username: "wrx_priya",
        passwordHash,
        displayName: "Priya Subaru",
        bio: "Stage 2 WRX STI, canyon carver, coffee enthusiast.",
        avatarUrl: "https://i.pravatar.cc/150?u=wrx_priya",
      },
    }),
    prisma.user.create({
      data: {
        email: "jake@garagehub.dev",
        username: "ls_swap_jake",
        passwordHash,
        displayName: "LS Swap Jake",
        bio: "If it ain't LS swapped it ain't finished. Miata + LS = perfection.",
        avatarUrl: "https://i.pravatar.cc/150?u=ls_swap_jake",
      },
    }),
  ]);

  console.log("Users created.");

  // ------------------------------------------------------------------
  // Cars
  // ------------------------------------------------------------------
  const [
    mikeSupra,
    mikeEvo,
    sarahS13,
    sarahS14,
    carlosMustang,
    carlosCamaro,
    priyaWrx,
    priyaBrz,
    jakeMiata,
    jakeC5,
  ] = await Promise.all([
    // Mike — turbo builds
    prisma.car.create({
      data: {
        userId: mike.id,
        year: 2020,
        make: "Toyota",
        model: "Supra",
        trim: "GR Supra 3.0 Premium",
        description:
          "Single turbo B58 build. Upgraded intercooler, downpipe, and Ethanol flex fuel kit. Tune by AAM Competition.",
        horsepower: 560,
        photos: [
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
          "https://images.unsplash.com/photo-1617814075641-3d8c3e5c8e17?w=800",
        ],
        isFeatured: true,
      },
    }),
    prisma.car.create({
      data: {
        userId: mike.id,
        year: 2006,
        make: "Mitsubishi",
        model: "Lancer Evolution",
        trim: "IX MR",
        description:
          "Track-prepped Evo IX. Full bolt-ons, Evo X head swap, AMS 2.3L stroker kit. Dedicated track car.",
        horsepower: 480,
        photos: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        ],
        isFeatured: false,
      },
    }),

    // Sarah — JDM drift builds
    prisma.car.create({
      data: {
        userId: sarah.id,
        year: 1995,
        make: "Nissan",
        model: "240SX",
        trim: "S13 Hatch",
        description:
          "SR20DET swapped S13. Full coilovers, angle kit, 5-lug conversion. Currently running Formula D Pro Am.",
        horsepower: 310,
        photos: [
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
          "https://images.unsplash.com/photo-1549399542-7e72e0c7e25b?w=800",
        ],
        isFeatured: true,
      },
    }),
    prisma.car.create({
      data: {
        userId: sarah.id,
        year: 1997,
        make: "Nissan",
        model: "240SX",
        trim: "S14 Kouki",
        description:
          "Clean S14 project. KA24DE with head work, full suspension refresh. Daily driver / occasional drift missile.",
        horsepower: 175,
        photos: [
          "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
        ],
        isFeatured: false,
      },
    }),

    // Carlos — American muscle
    prisma.car.create({
      data: {
        userId: carlos.id,
        year: 2022,
        make: "Ford",
        model: "Mustang",
        trim: "GT500",
        description:
          "Shelby GT500 with supercharger pulley swap, ported blower, and E85 tune. One of the fastest street cars in the county.",
        horsepower: 820,
        photos: [
          "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=800",
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
        ],
        isFeatured: true,
      },
    }),
    prisma.car.create({
      data: {
        userId: carlos.id,
        year: 2018,
        make: "Chevrolet",
        model: "Camaro",
        trim: "ZL1",
        description:
          "ZL1 with track package. Stickier tires, brake upgrade, and mild tune. Weekend cruiser and occasional drag strip visitor.",
        horsepower: 680,
        photos: [
          "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800",
        ],
        isFeatured: false,
      },
    }),

    // Priya — Subaru
    prisma.car.create({
      data: {
        userId: priya.id,
        year: 2021,
        make: "Subaru",
        model: "WRX STI",
        trim: "Limited",
        description:
          "Stage 2+ STI. COBB Stage 2+ OTS map, Perrin intake, Blouch turbo inlet, 3-inch turbo-back exhaust. AWD canyon destroyer.",
        horsepower: 385,
        photos: [
          "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800",
        ],
        isFeatured: true,
      },
    }),
    prisma.car.create({
      data: {
        userId: priya.id,
        year: 2019,
        make: "Subaru",
        model: "BRZ",
        trim: "Limited",
        description:
          "Naturally aspirated BRZ built for handling. Coilovers, sway bars, alignment spec'd by shop. Best pure driving experience.",
        horsepower: 210,
        photos: [
          "https://images.unsplash.com/photo-1586336153815-4e6c1ff7e86f?w=800",
        ],
        isFeatured: false,
      },
    }),

    // Jake — LS swaps
    prisma.car.create({
      data: {
        userId: jake.id,
        year: 1999,
        make: "Mazda",
        model: "Miata",
        trim: "NB LS Swap",
        description:
          "LS1 swapped NB Miata. The unholy combination. 5.7L V8 in a 2400 lb car. Custom headers, T56 transmission. Absolutely terrifying.",
        horsepower: 420,
        photos: [
          "https://images.unsplash.com/photo-1616714564956-9d406d5c0c7f?w=800",
          "https://images.unsplash.com/photo-1616714564789-4bd5ca4e3d6b?w=800",
        ],
        isFeatured: true,
      },
    }),
    prisma.car.create({
      data: {
        userId: jake.id,
        year: 2002,
        make: "Chevrolet",
        model: "Corvette",
        trim: "C5 Z06",
        description:
          "C5 Z06 with heads/cam package, long tube headers, and stall converter. Sleeper that runs 10s in the quarter.",
        horsepower: 510,
        photos: [
          "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
        ],
        isFeatured: false,
      },
    }),
  ]);

  console.log("Cars created.");

  // ------------------------------------------------------------------
  // Posts
  // ------------------------------------------------------------------
  const posts = await Promise.all([
    // Mike's posts
    prisma.post.create({
      data: {
        authorId: mike.id,
        carId: mikeSupra.id,
        postType: "DYNO_RESULT",
        content:
          "Finally strapped the Supra to the dyno after the E85 tune! 560whp / 520wtq on a conservative tune — still some room left. The B58 just doesn't stop pulling. Massive thank you to AAM Competition for the calibration work. Full bolt-on list in the comments.",
        photos: [
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
        ],
        dynoHp: 560,
        dynoTorque: 520,
        dynoRpm: 6200,
      },
    }),
    prisma.post.create({
      data: {
        authorId: mike.id,
        carId: mikeSupra.id,
        postType: "BUILD_UPDATE",
        content:
          "Intercooler upgrade is done! Went with the Wagner Tuning unit — massive bar-and-plate compared to the stock unit. Intake temps dropped 35°F under full load. Next step is the fuel system upgrade for higher ethanol blends.",
        photos: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        ],
      },
    }),
    prisma.post.create({
      data: {
        authorId: mike.id,
        carId: mikeEvo.id,
        postType: "BUILD_UPDATE",
        content:
          "Evo IX stroker kit is in. 2.3L AMS unit with the Evo X head swap — this thing is going to be a monster. Block is buttoned up, just waiting on the turbo manifold from Buschur. Dyno appointment booked for next month.",
        photos: [],
      },
    }),
    prisma.post.create({
      data: {
        authorId: mike.id,
        postType: "GENERAL",
        content:
          "Hot take: the B58 Supra is a better driver's car than the 2JZ mk4 ever was. Change my mind. (I know I know, blasphemy — but hear me out...)",
        photos: [],
      },
    }),

    // Sarah's posts
    prisma.post.create({
      data: {
        authorId: sarah.id,
        carId: sarahS13.id,
        postType: "PHOTO",
        content:
          "Tandem session at Irwindale last weekend. The S13 is finally clicking the way I want it to. Angle kit makes such a huge difference in transitions. Huge shoutout to my co-driver for running with me all day!",
        photos: [
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
          "https://images.unsplash.com/photo-1549399542-7e72e0c7e25b?w=800",
        ],
      },
    }),
    prisma.post.create({
      data: {
        authorId: sarah.id,
        carId: sarahS13.id,
        postType: "DYNO_RESULT",
        content:
          "SR20DET tune is done. 310whp on the stock bottom end — pushing the limit but it's been solid for two seasons. Tuner said we have room for more with forged internals. That's next winter's project.",
        photos: [],
        dynoHp: 310,
        dynoTorque: 265,
        dynoRpm: 7200,
      },
    }),
    prisma.post.create({
      data: {
        authorId: sarah.id,
        carId: sarahS14.id,
        postType: "BUILD_UPDATE",
        content:
          "S14 Kouki project update: full suspension refresh complete. New Stance coilovers, Whiteline sway bars front and rear, and a proper alignment at 3.5 degrees negative camber up front. The difference in feel is night and day.",
        photos: [
          "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
        ],
      },
    }),
    prisma.post.create({
      data: {
        authorId: sarah.id,
        postType: "GENERAL",
        content:
          "Unpopular opinion: S13 > S14 for pure drift feel. The shorter wheelbase just makes everything snappier. S14 is prettier though, I'll give it that.",
        photos: [],
      },
    }),

    // Carlos's posts
    prisma.post.create({
      data: {
        authorId: carlos.id,
        carId: carlosMustang.id,
        postType: "DYNO_RESULT",
        content:
          "820whp on E85. Let that sink in. Stock block Shelby GT500 supercharged V8 making GT2 RS numbers. The pulley swap + ported blower is a cheat code. Still street legal. Still drives to work on Mondays.",
        photos: [
          "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=800",
        ],
        dynoHp: 820,
        dynoTorque: 710,
        dynoRpm: 6500,
      },
    }),
    prisma.post.create({
      data: {
        authorId: carlos.id,
        carId: carlosMustang.id,
        postType: "PHOTO",
        content:
          "Took the GT500 out to the canyons this morning. You forget how wide this car is until you're threading through mountain switchbacks. Every exit is a workout. Worth it.",
        photos: [
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
        ],
      },
    }),
    prisma.post.create({
      data: {
        authorId: carlos.id,
        carId: carlosCamaro.id,
        postType: "BUILD_UPDATE",
        content:
          "ZL1 just got sticky — Michelin Pilot Sport Cup 2s all around. First impressions: these things are a completely different tire in the corners. Track day next weekend will be the real test.",
        photos: [],
      },
    }),

    // Priya's posts
    prisma.post.create({
      data: {
        authorId: priya.id,
        carId: priyaWrx.id,
        postType: "DYNO_RESULT",
        content:
          "Stage 2+ tune complete! 385whp / 390wtq on 91 octane. COBB AccessPort is doing its thing. The Blouch turbo inlet made a bigger difference than I expected — better spool and peak power. Very happy with where this is.",
        photos: [],
        dynoHp: 385,
        dynoTorque: 390,
        dynoRpm: 5800,
      },
    }),
    prisma.post.create({
      data: {
        authorId: priya.id,
        carId: priyaBrz.id,
        postType: "BUILD_UPDATE",
        content:
          "BRZ handling build is basically done. Tein Street Advance coilovers at corner weight, Whiteline sway bars, Cusco strut brace. The car is a different beast — rotates so naturally now. Next: better brake pads and fluid for canyon runs.",
        photos: [
          "https://images.unsplash.com/photo-1586336153815-4e6c1ff7e86f?w=800",
        ],
      },
    }),
    prisma.post.create({
      data: {
        authorId: priya.id,
        postType: "GENERAL",
        content:
          "Morning coffee + canyon run in the BRZ = perfect Saturday. Sometimes you don't need 500hp. You just need the right car on the right road.",
        photos: [],
      },
    }),

    // Jake's posts
    prisma.post.create({
      data: {
        authorId: jake.id,
        carId: jakeMiata.id,
        postType: "BUILD_UPDATE",
        content:
          "LS Miata is ALIVE. First start after the swap — she fires right up. The sound coming out of a tiny Miata is genuinely disturbing. Custom headers are raspy as hell. Neighbors are already complaining and I haven't even driven it yet.",
        photos: [
          "https://images.unsplash.com/photo-1616714564956-9d406d5c0c7f?w=800",
        ],
      },
    }),
    prisma.post.create({
      data: {
        authorId: jake.id,
        carId: jakeMiata.id,
        postType: "DYNO_RESULT",
        content:
          "420whp in a 2400lb car. The math is terrifying. The LS1 in the Miata made 420whp / 395wtq on its first tune. Traction is a suggestion at this point. Pure, unfiltered lunacy. 10/10 would LS swap again.",
        photos: [
          "https://images.unsplash.com/photo-1616714564789-4bd5ca4e3d6b?w=800",
        ],
        dynoHp: 420,
        dynoTorque: 395,
        dynoRpm: 5900,
      },
    }),
    prisma.post.create({
      data: {
        authorId: jake.id,
        carId: jakeC5.id,
        postType: "DYNO_RESULT",
        content:
          "C5 Z06 heads/cam build put down 510whp. Ran a 10.8 at Fontana last week on street tires. Everybody sleeping on C5s is making a big mistake — these things are absolutely stupid fast for the money.",
        photos: [],
        dynoHp: 510,
        dynoTorque: 480,
        dynoRpm: 6100,
      },
    }),
    prisma.post.create({
      data: {
        authorId: jake.id,
        postType: "GENERAL",
        content:
          "The LS swap meme is a meme for a reason — the engine is genuinely the best performance value proposition ever made. Reliable, cheap to build, makes absurd power, fits in almost anything. Long live the LS.",
        photos: [],
      },
    }),
  ]);

  console.log(`Posts created: ${posts.length}`);

  // ------------------------------------------------------------------
  // Comments
  // ------------------------------------------------------------------
  const [
    mikeSupraDynoPost,
    mikeEvoPost,
    _mikeBuildPost,
    _mikeHotTakePost,
    sarahDriftPost,
    sarahDynoPost,
    _sarahS14Post,
    _sarahHotTakePost,
    carlosDynoPost,
    carlosPhotoPost,
    _carlosCamaroPost,
    priyaDynoPost,
    _priyaBrzPost,
    _priyaGeneralPost,
    jakeMiataFirstStartPost,
    jakeMiataDynoPost,
    _jakeC5Post,
    _jakeGeneralPost,
  ] = posts;

  await Promise.all([
    prisma.comment.create({
      data: {
        postId: mikeSupraDynoPost.id,
        authorId: sarah.id,
        content: "560whp?! That's insane for a street car. What fuel system are you running?",
      },
    }),
    prisma.comment.create({
      data: {
        postId: mikeSupraDynoPost.id,
        authorId: carlos.id,
        content: "Turbo four making GT3 numbers. Wild times we live in.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: mikeSupraDynoPost.id,
        authorId: jake.id,
        content: "Inject this into my veins. Now do the LS swap.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: mikeSupraDynoPost.id,
        authorId: priya.id,
        content: "The B58 is genuinely underrated. Great number!",
      },
    }),

    prisma.comment.create({
      data: {
        postId: sarahDriftPost.id,
        authorId: mike.id,
        content: "Those transition angles look insane. What's your steering angle at now?",
      },
    }),
    prisma.comment.create({
      data: {
        postId: sarahDriftPost.id,
        authorId: jake.id,
        content: "Irwindale is the best. SR20 sound at full chat is something else.",
      },
    }),

    prisma.comment.create({
      data: {
        postId: carlosDynoPost.id,
        authorId: mike.id,
        content: "820whp from a factory supercharger with a pulley swap... Ford engineers should be scared.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: carlosDynoPost.id,
        authorId: sarah.id,
        content: "American muscle doing American muscle things. Respect.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: carlosDynoPost.id,
        authorId: priya.id,
        content: "That torque number is obscene. How are you keeping the rear planted?",
      },
    }),

    prisma.comment.create({
      data: {
        postId: jakeMiataFirstStartPost.id,
        authorId: sarah.id,
        content: "YESSSSS. The LS Miata lives!! What does it sound like?",
      },
    }),
    prisma.comment.create({
      data: {
        postId: jakeMiataFirstStartPost.id,
        authorId: carlos.id,
        content: "Now THAT is a proper build. V8 in a Miata is peak automotive engineering.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: jakeMiataFirstStartPost.id,
        authorId: mike.id,
        content: "The neighbors aren't ready. Nobody is ready.",
      },
    }),

    prisma.comment.create({
      data: {
        postId: jakeMiataDynoPost.id,
        authorId: priya.id,
        content: "420whp / 2400lbs = 5.7 lb/hp. You're going to die and I'm jealous.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: jakeMiataDynoPost.id,
        authorId: mike.id,
        content: "This is what freedom smells like.",
      },
    }),

    prisma.comment.create({
      data: {
        postId: priyaDynoPost.id,
        authorId: mike.id,
        content: "Stage 2+ STI is no joke. AWD traction on that power must be incredible.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: priyaDynoPost.id,
        authorId: sarah.id,
        content: "390wtq from a factory 2.5? The EJ is a legend.",
      },
    }),

    prisma.comment.create({
      data: {
        postId: sarahDynoPost.id,
        authorId: jake.id,
        content: "310whp on a stock SR20 bottom end — you're living dangerously. Love it.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: mikeEvoPost.id,
        authorId: priya.id,
        content: "Evo IX with a 2.3 stroker is going to be an absolute weapon. Following this build closely.",
      },
    }),
    prisma.comment.create({
      data: {
        postId: carlosPhotoPost.id,
        authorId: jake.id,
        content: "GT500 in the canyons is such a committed choice. Mad respect.",
      },
    }),
  ]);

  console.log("Comments created.");

  // ------------------------------------------------------------------
  // Likes — spread across posts
  // ------------------------------------------------------------------
  const likeData: { postId: string; userId: string }[] = [
    // Mike's Supra dyno post — everyone likes it
    { postId: mikeSupraDynoPost.id, userId: sarah.id },
    { postId: mikeSupraDynoPost.id, userId: carlos.id },
    { postId: mikeSupraDynoPost.id, userId: priya.id },
    { postId: mikeSupraDynoPost.id, userId: jake.id },

    // Sarah's drift photo
    { postId: sarahDriftPost.id, userId: mike.id },
    { postId: sarahDriftPost.id, userId: carlos.id },
    { postId: sarahDriftPost.id, userId: priya.id },
    { postId: sarahDriftPost.id, userId: jake.id },

    // Carlos's 820whp dyno
    { postId: carlosDynoPost.id, userId: mike.id },
    { postId: carlosDynoPost.id, userId: sarah.id },
    { postId: carlosDynoPost.id, userId: priya.id },
    { postId: carlosDynoPost.id, userId: jake.id },

    // Jake's LS Miata first start
    { postId: jakeMiataFirstStartPost.id, userId: mike.id },
    { postId: jakeMiataFirstStartPost.id, userId: sarah.id },
    { postId: jakeMiataFirstStartPost.id, userId: carlos.id },
    { postId: jakeMiataFirstStartPost.id, userId: priya.id },

    // Jake's Miata dyno
    { postId: jakeMiataDynoPost.id, userId: mike.id },
    { postId: jakeMiataDynoPost.id, userId: sarah.id },
    { postId: jakeMiataDynoPost.id, userId: carlos.id },
    { postId: jakeMiataDynoPost.id, userId: priya.id },

    // Priya's WRX dyno
    { postId: priyaDynoPost.id, userId: mike.id },
    { postId: priyaDynoPost.id, userId: sarah.id },
    { postId: priyaDynoPost.id, userId: jake.id },

    // Sarah's dyno post
    { postId: sarahDynoPost.id, userId: mike.id },
    { postId: sarahDynoPost.id, userId: priya.id },
    { postId: sarahDynoPost.id, userId: jake.id },
  ];

  await Promise.all(
    likeData.map(({ postId, userId }) =>
      prisma.like.create({ data: { postId, userId } })
    )
  );

  console.log("Likes created.");

  // ------------------------------------------------------------------
  // Follow relationships
  // ------------------------------------------------------------------
  const followData: { followerId: string; followingId: string }[] = [
    // Everyone follows Mike (Supra content is popular)
    { followerId: sarah.id, followingId: mike.id },
    { followerId: carlos.id, followingId: mike.id },
    { followerId: priya.id, followingId: mike.id },
    { followerId: jake.id, followingId: mike.id },

    // Mike follows Sarah and Jake
    { followerId: mike.id, followingId: sarah.id },
    { followerId: mike.id, followingId: jake.id },

    // Sarah follows Priya and Jake
    { followerId: sarah.id, followingId: priya.id },
    { followerId: sarah.id, followingId: jake.id },

    // Carlos follows Jake
    { followerId: carlos.id, followingId: jake.id },

    // Priya follows Sarah and Carlos
    { followerId: priya.id, followingId: sarah.id },
    { followerId: priya.id, followingId: carlos.id },

    // Jake follows Mike and Carlos
    { followerId: jake.id, followingId: mike.id },
    { followerId: jake.id, followingId: carlos.id },
  ];

  // Deduplicate in case of logic overlap
  const seenFollows = new Set<string>();
  const uniqueFollows = followData.filter(({ followerId, followingId }) => {
    const key = `${followerId}:${followingId}`;
    if (seenFollows.has(key) || followerId === followingId) return false;
    seenFollows.add(key);
    return true;
  });

  await Promise.all(
    uniqueFollows.map(({ followerId, followingId }) =>
      prisma.follow.create({ data: { followerId, followingId } })
    )
  );

  console.log("Follows created.");

  // ------------------------------------------------------------------
  // Events
  // ------------------------------------------------------------------
  const [socalMeet, trackDay, showAndShine] = await Promise.all([
    prisma.event.create({
      data: {
        organizerId: mike.id,
        title: "SoCal Enthusiast Monthly Meet",
        description:
          "Monthly GarageHub meetup at the Pomona Fairplex parking lot. All makes and models welcome — JDM, Euro, domestic, whatever you drive. Coffee, car chat, and some friendly rolling dyno comparisons. Free entry.",
        location: "Pomona Fairplex, 1101 W McKinley Ave, Pomona, CA 91768",
        date: new Date("2026-05-10T09:00:00-07:00"),
        coverImageUrl:
          "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800",
      },
    }),
    prisma.event.create({
      data: {
        organizerId: priya.id,
        title: "Buttonwillow Track Day — Open Lapping",
        description:
          "Open lapping day at Buttonwillow Raceway Park. All skill levels welcome — beginner, intermediate, and advanced run groups. Corner workers provided. Helmets required, must have functioning harness and seats. Grid opens at 7AM.",
        location: "Buttonwillow Raceway Park, 24551 Lerdo Hwy, Buttonwillow, CA 93206",
        date: new Date("2026-05-24T07:00:00-07:00"),
        coverImageUrl:
          "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800",
      },
    }),
    prisma.event.create({
      data: {
        organizerId: carlos.id,
        title: "Muscle & Metal Show and Shine",
        description:
          "Annual show and shine celebrating American muscle and modified imports alike. Classes for stock, modified street, and full-build. Trophy categories: best paint, best engine bay, people's choice, and best in show. Food trucks on site.",
        location: "OC Fair & Event Center, 88 Fair Dr, Costa Mesa, CA 92626",
        date: new Date("2026-06-07T10:00:00-07:00"),
        coverImageUrl:
          "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
      },
    }),
  ]);

  console.log("Events created.");

  // ------------------------------------------------------------------
  // RSVPs
  // ------------------------------------------------------------------
  await Promise.all([
    // SoCal Monthly Meet — organized by Mike, everyone's in
    prisma.rSVP.create({ data: { eventId: socalMeet.id, userId: mike.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: socalMeet.id, userId: sarah.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: socalMeet.id, userId: carlos.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: socalMeet.id, userId: priya.id, status: "MAYBE" } }),
    prisma.rSVP.create({ data: { eventId: socalMeet.id, userId: jake.id, status: "GOING" } }),

    // Buttonwillow Track Day — organized by Priya, track crowd RSVPs
    prisma.rSVP.create({ data: { eventId: trackDay.id, userId: priya.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: trackDay.id, userId: mike.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: trackDay.id, userId: sarah.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: trackDay.id, userId: jake.id, status: "MAYBE" } }),
    prisma.rSVP.create({ data: { eventId: trackDay.id, userId: carlos.id, status: "NOT_GOING" } }),

    // Show and Shine — organized by Carlos
    prisma.rSVP.create({ data: { eventId: showAndShine.id, userId: carlos.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: showAndShine.id, userId: mike.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: showAndShine.id, userId: priya.id, status: "GOING" } }),
    prisma.rSVP.create({ data: { eventId: showAndShine.id, userId: sarah.id, status: "MAYBE" } }),
    prisma.rSVP.create({ data: { eventId: showAndShine.id, userId: jake.id, status: "GOING" } }),
  ]);

  console.log("RSVPs created.");
  console.log("\nSeeding complete!");
  console.log(`  Users:    5`);
  console.log(`  Cars:     10`);
  console.log(`  Posts:    ${posts.length}`);
  console.log(`  Events:   3`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
