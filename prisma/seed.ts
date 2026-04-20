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
  // Phase 2 models — must be deleted before their dependencies
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.clubPost.deleteMany();
  await prisma.clubMembership.deleteMany();
  await prisma.carClub.deleteMany();
  await prisma.carMod.deleteMany();
  await prisma.buildUpdate.deleteMany();
  // Phase 1 models
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

  // ------------------------------------------------------------------
  // BUILD_UPDATE posts (postType = BUILD_UPDATE, carId set)
  // ------------------------------------------------------------------
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  const buildUpdatePosts = await Promise.all([
    prisma.post.create({
      data: {
        authorId: mike.id,
        carId: mikeSupra.id,
        postType: "BUILD_UPDATE",
        content:
          "Finally installed the Garrett GT35R turbo kit — first pull on E85 put down 340whp at a conservative base tune. Full tune appointment booked for next week. The spool is violent in the best way possible.",
        photos: [],
        createdAt: daysAgo(80),
      },
    }),
    prisma.post.create({
      data: {
        authorId: mike.id,
        carId: mikeEvo.id,
        postType: "BUILD_UPDATE",
        content:
          "AMS 2.3L stroker kit is finally bolted in on the Evo. Block is sealed, new ACL race bearings throughout. Waiting on the Buschur Racing turbo manifold before first start. This thing is going to make the neighbors angry.",
        photos: [],
        createdAt: daysAgo(60),
      },
    }),
    prisma.post.create({
      data: {
        authorId: sarah.id,
        carId: sarahS13.id,
        postType: "BUILD_UPDATE",
        content:
          "KW V3 coilovers are on the S13. Dropped it 2.5 inches, set at full stiff in the rear for drift. The stance is mean. Alignment next week then back to Irwindale for testing.",
        photos: [],
        createdAt: daysAgo(45),
      },
    }),
    prisma.post.create({
      data: {
        authorId: priya.id,
        carId: priyaWrx.id,
        postType: "BUILD_UPDATE",
        content:
          "HKS Hi-Power catback is on the STI. The note at full boost in third gear is addictive. Drone at highway is minimal — HKS absolutely nailed the tuning on this exhaust. Highly recommend.",
        photos: [],
        createdAt: daysAgo(30),
      },
    }),
    prisma.post.create({
      data: {
        authorId: jake.id,
        carId: jakeMiata.id,
        postType: "BUILD_UPDATE",
        content:
          "Brembo GT6 big brake kit front and rear on the LS Miata. Stopping 420whp in a 2400lb car needs serious brakes. Wilwood slotted rotors, Hawk DTC-70 pads. First track test this weekend at Chuckwalla.",
        photos: [],
        createdAt: daysAgo(20),
      },
    }),
    prisma.post.create({
      data: {
        authorId: carlos.id,
        carId: carlosMustang.id,
        postType: "BUILD_UPDATE",
        content:
          "Fuel system upgrade complete on the GT500 — Fore Innovations triple pump hat, ID1050x injectors, dual -10AN feed. Now running full E85 without any lean spots. Tune session tomorrow — expecting 850+ whp.",
        photos: [],
        createdAt: daysAgo(10),
      },
    }),
  ]);

  console.log(`BUILD_UPDATE posts created: ${buildUpdatePosts.length}`);

  // ------------------------------------------------------------------
  // BuildUpdate rows (build thread timeline entries)
  // ------------------------------------------------------------------
  const buildUpdates = await Promise.all([
    // Mike's Supra build thread
    prisma.buildUpdate.create({
      data: {
        carId: mikeSupra.id,
        title: "Stage 1 bolt-ons complete",
        description:
          "Downpipe, intake, intercooler, and charge pipe kit all installed. First drive impressions: noticeably more top-end pull, turbo spools harder. Base tune next.",
        photos: [],
        createdAt: daysAgo(120),
      },
    }),
    prisma.buildUpdate.create({
      data: {
        carId: mikeSupra.id,
        title: "Flex fuel kit installed — E30 blend first fill",
        description:
          "Ethanol content sensor from Fuel-It installed inline. Tuner has flex map ready. First fill was E30 — immediate difference in throttle response. E85 next month.",
        photos: [],
        createdAt: daysAgo(95),
      },
    }),
    prisma.buildUpdate.create({
      data: {
        carId: mikeSupra.id,
        title: "340whp on E85 — base tune numbers",
        description:
          "Base tune put down 340whp on E85 at a conservative 20psi. Safe AFRs throughout. Full tune next week — tuner expects 380+ safely on this fuel.",
        photos: [],
        createdAt: daysAgo(80),
      },
    }),
    // Mike's Evo build thread
    prisma.buildUpdate.create({
      data: {
        carId: mikeEvo.id,
        title: "Engine out, teardown begins",
        description:
          "4G63 is out and on the engine stand. Teardown revealed the stock crank and rods are in great shape — perfect candidate for the 2.3L stroker kit.",
        photos: [],
        createdAt: daysAgo(90),
      },
    }),
    prisma.buildUpdate.create({
      data: {
        carId: mikeEvo.id,
        title: "AMS 2.3L stroker assembled",
        description:
          "Block bored 0.5mm over, AMS pistons, Manley H-beam rods, ACL race bearings. Machine shop work was flawless. Evo X head swap with port and polish going on next.",
        photos: [],
        createdAt: daysAgo(60),
      },
    }),
    // Sarah's S13 build thread
    prisma.buildUpdate.create({
      data: {
        carId: sarahS13.id,
        title: "SR20DET swap complete",
        description:
          "KA24DE is out, SR20DET is in. Used a Wiring Specialties harness — plug-and-play is the only way to do a swap in 2025. First start went smooth. Timing set, idle dialed in.",
        photos: [],
        createdAt: daysAgo(180),
      },
    }),
    prisma.buildUpdate.create({
      data: {
        carId: sarahS13.id,
        title: "Angle kit and 5-lug conversion",
        description:
          "Wisefab angle kit welded and bolted. 5-lug conversion done with Z32 hubs and Z32 twin-piston front calipers. Full geometry set with maximum lock — ready for Formula D Pro Am.",
        photos: [],
        createdAt: daysAgo(130),
      },
    }),
    prisma.buildUpdate.create({
      data: {
        carId: sarahS13.id,
        title: "KW V3 coilovers and alignment",
        description:
          "KW V3s set at -3.5 degrees front camber, full compression stiff rear. Alignment dialed to my drift spec sheet. Car feels planted on entry and predictable mid-corner.",
        photos: [],
        createdAt: daysAgo(45),
      },
    }),
    // Jake's Miata build thread
    prisma.buildUpdate.create({
      data: {
        carId: jakeMiata.id,
        title: "LS1 swap — engine mounted",
        description:
          "Sikky Manufacturing motor mounts and oil pan kit made the LS1 fit surprisingly well. T56 transmission tunnel needed minor massaging. Driveshaft at the shop being shortened.",
        photos: [],
        createdAt: daysAgo(150),
      },
    }),
    prisma.buildUpdate.create({
      data: {
        carId: jakeMiata.id,
        title: "Wiring complete, first start",
        description:
          "Standalone Haltech Elite 2500 ECU running everything. Fired up first try — idle is smooth. The sound from a LS1 in a Miata engine bay is genuinely traumatizing in the best way.",
        photos: [],
        createdAt: daysAgo(100),
      },
    }),
  ]);

  console.log(`BuildUpdate rows created: ${buildUpdates.length}`);

  // ------------------------------------------------------------------
  // CarMod rows
  // ------------------------------------------------------------------
  const carMods = await Promise.all([
    // Mike's Supra mods
    prisma.carMod.create({
      data: {
        carId: mikeSupra.id,
        category: "FORCED_INDUCTION",
        partName: "GT35R Turbo Kit",
        brand: "Garrett",
        price: 3800,
        installDate: daysAgo(85),
        notes: "Full kit with manifold, wastegate, and intercooler piping",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: mikeSupra.id,
        category: "INTAKE",
        partName: "Performance Cold Air Intake",
        brand: "Wagner Tuning",
        price: 420,
        installDate: daysAgo(120),
        notes: "Bar-and-plate intercooler core, massive flow improvement",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: mikeSupra.id,
        category: "EXHAUST",
        partName: "3-inch Catless Downpipe",
        brand: "AAM Competition",
        price: 680,
        installDate: daysAgo(120),
        notes: "Catless — track use only (off-road disclaimer)",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: mikeSupra.id,
        category: "FUEL",
        partName: "Flex Fuel Kit with Ethanol Sensor",
        brand: "Fuel-It",
        price: 350,
        installDate: daysAgo(95),
        notes: "Inline ethanol content sensor, works with Bootmod3 flex maps",
      },
    }),
    // Mike's Evo mods
    prisma.carMod.create({
      data: {
        carId: mikeEvo.id,
        category: "ENGINE",
        partName: "2.3L Stroker Kit",
        brand: "AMS Performance",
        price: 4200,
        installDate: daysAgo(60),
        notes: "AMS pistons, Manley H-beam rods, ACL race bearings",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: mikeEvo.id,
        category: "ENGINE",
        partName: "Evo X Head with Port and Polish",
        brand: "Buschur Racing",
        price: 1800,
        installDate: daysAgo(58),
        notes: "Drop-in with minor cam timing adjustment",
      },
    }),
    // Sarah's S13 mods
    prisma.carMod.create({
      data: {
        carId: sarahS13.id,
        category: "SUSPENSION",
        partName: "V3 Coilover Kit",
        brand: "KW Suspension",
        price: 2400,
        installDate: daysAgo(45),
        notes: "Compression and rebound adjustable, set full stiff rear for drift",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: sarahS13.id,
        category: "BRAKES",
        partName: "Z32 Twin-Piston Front Calipers",
        brand: "Nissan OEM",
        price: 320,
        installDate: daysAgo(130),
        notes: "Part of 5-lug conversion kit using Z32 hubs",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: sarahS13.id,
        category: "DRIVETRAIN",
        partName: "Wisefab Angle Kit",
        brand: "Wisefab",
        price: 1650,
        installDate: daysAgo(130),
        notes: "Welded in + bolted knuckle extension. Full lock-to-lock is wild.",
      },
    }),
    // Jake's Miata mods
    prisma.carMod.create({
      data: {
        carId: jakeMiata.id,
        category: "ENGINE",
        partName: "LS1 5.7L V8 Engine",
        brand: "GM",
        price: 2200,
        installDate: daysAgo(155),
        notes: "Junkyard pull, 80k miles, fully rebuilt with new gaskets and seals",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: jakeMiata.id,
        category: "EXHAUST",
        partName: "Custom Long Tube Headers",
        brand: "Custom Fab",
        price: 900,
        installDate: daysAgo(148),
        notes: "Fabricated by local shop to clear Miata framerails. 1-7/8 primaries.",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: jakeMiata.id,
        category: "BRAKES",
        partName: "GT6 Big Brake Kit",
        brand: "Brembo",
        price: 3200,
        installDate: daysAgo(20),
        notes: "6-piston front, 4-piston rear. Wilwood slotted rotors. Hawk DTC-70 pads.",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: jakeMiata.id,
        category: "ELECTRONICS",
        partName: "Elite 2500 Standalone ECU",
        brand: "Haltech",
        price: 2800,
        installDate: daysAgo(102),
        notes: "Full engine management, wide-band O2, boost control, launch control",
      },
    }),
    // Priya's WRX mods
    prisma.carMod.create({
      data: {
        carId: priyaWrx.id,
        category: "EXHAUST",
        partName: "Hi-Power Catback Exhaust",
        brand: "HKS",
        price: 1100,
        installDate: daysAgo(30),
        notes: "3-inch piping, titanium tip. Drone at highway is minimal — great daily.",
      },
    }),
    prisma.carMod.create({
      data: {
        carId: priyaWrx.id,
        category: "ELECTRONICS",
        partName: "AccessPort V3",
        brand: "COBB Tuning",
        price: 680,
        installDate: daysAgo(200),
        notes: "Stage 2+ OTS map. Flash and go — biggest bang for buck on an STI.",
      },
    }),
  ]);

  console.log(`CarMod rows created: ${carMods.length}`);

  // ------------------------------------------------------------------
  // CarClubs
  // ------------------------------------------------------------------
  const [jdmLegends, pnwEuro, boostedDaily, airClub, trackRegulars, classicMuscle] =
    await Promise.all([
      prisma.carClub.create({
        data: {
          name: "JDM Legends",
          description:
            "Celebrating the golden era of Japanese performance — AE86, NSX, Supra, Evo, STI, RX-7, GT-R. If it came from Japan and it's fast, it belongs here. Build threads, meets, and dyno days.",
          coverImage: "/uploads/clubs/jdm-legends-cover.jpg",
          creatorId: sarah.id,
        },
      }),
      prisma.carClub.create({
        data: {
          name: "PNW Euro Collective",
          description:
            "Pacific Northwest European car community. BMW, Porsche, Audi, VW, Mercedes, Volvo — all corners of the continent welcome. Annual Alpine run every September.",
          coverImage: "/uploads/clubs/pnw-euro-cover.jpg",
          creatorId: priya.id,
        },
      }),
      prisma.carClub.create({
        data: {
          name: "Boosted Daily Drivers",
          description:
            "Your car has a turbo or supercharger AND you drive it to work? Welcome home. Boost gauge, grocery getter, daily abuse — that's our lifestyle. Maintenance tips, tune reviews, and occasional boost creep stories.",
          coverImage: "/uploads/clubs/boosted-daily-cover.jpg",
          creatorId: mike.id,
        },
      }),
      prisma.carClub.create({
        data: {
          name: "Air Suspension Club",
          description:
            "Frame scrapers and bag riders unite. Static drop, air ride, hydraulics — all forms of the low life are welcome. Bag setups, management systems, and show build inspiration.",
          coverImage: null,
          creatorId: jake.id,
        },
      }),
      prisma.carClub.create({
        data: {
          name: "Track Day Regulars",
          description:
            "We live at the track. Buttonwillow, Streets of Willow, Auto Club Speedway, Chuckwalla — if it has a pit lane we're there. Lap times, data logging, corner-work volunteering, and helmet reviews.",
          coverImage: "/uploads/clubs/track-day-cover.jpg",
          creatorId: priya.id,
        },
      }),
      prisma.carClub.create({
        data: {
          name: "Classic Muscle Garage",
          description:
            "Pre-1980 American iron only. Muscle cars, pony cars, and the occasional resto-mod. Concours restorations, pro-touring builds, and barn finds welcome. LS swaps debated but tolerated.",
          coverImage: "/uploads/clubs/classic-muscle-cover.jpg",
          creatorId: carlos.id,
        },
      }),
    ]);

  console.log("CarClubs created: 6");

  // ------------------------------------------------------------------
  // ClubMemberships — mike (user 0) is in at least 2 clubs
  // ------------------------------------------------------------------

  const membershipData: { clubId: string; userId: string; role: string }[] = [
    // JDM Legends — creator sarah, mike is member
    { clubId: jdmLegends.id, userId: sarah.id, role: "admin" },
    { clubId: jdmLegends.id, userId: mike.id, role: "member" },
    { clubId: jdmLegends.id, userId: priya.id, role: "member" },
    { clubId: jdmLegends.id, userId: jake.id, role: "member" },
    { clubId: jdmLegends.id, userId: carlos.id, role: "member" },

    // PNW Euro Collective — creator priya
    { clubId: pnwEuro.id, userId: priya.id, role: "admin" },
    { clubId: pnwEuro.id, userId: sarah.id, role: "member" },
    { clubId: pnwEuro.id, userId: carlos.id, role: "member" },

    // Boosted Daily Drivers — creator mike, mike is admin
    { clubId: boostedDaily.id, userId: mike.id, role: "admin" },
    { clubId: boostedDaily.id, userId: sarah.id, role: "member" },
    { clubId: boostedDaily.id, userId: priya.id, role: "member" },
    { clubId: boostedDaily.id, userId: jake.id, role: "member" },
    { clubId: boostedDaily.id, userId: carlos.id, role: "member" },

    // Air Suspension Club — creator jake
    { clubId: airClub.id, userId: jake.id, role: "admin" },
    { clubId: airClub.id, userId: carlos.id, role: "member" },
    { clubId: airClub.id, userId: sarah.id, role: "member" },

    // Track Day Regulars — creator priya, mike is member (second club)
    { clubId: trackRegulars.id, userId: priya.id, role: "admin" },
    { clubId: trackRegulars.id, userId: mike.id, role: "member" },
    { clubId: trackRegulars.id, userId: sarah.id, role: "member" },
    { clubId: trackRegulars.id, userId: jake.id, role: "member" },

    // Classic Muscle Garage — creator carlos
    { clubId: classicMuscle.id, userId: carlos.id, role: "admin" },
    { clubId: classicMuscle.id, userId: jake.id, role: "member" },
    { clubId: classicMuscle.id, userId: mike.id, role: "member" },
  ];

  await Promise.all(
    membershipData.map(({ clubId, userId, role }) =>
      prisma.clubMembership.create({ data: { clubId, userId, role } })
    )
  );

  console.log(`ClubMemberships created: ${membershipData.length}`);

  // ------------------------------------------------------------------
  // ClubPosts
  // ------------------------------------------------------------------
  const clubPosts = await Promise.all([
    // JDM Legends
    prisma.clubPost.create({
      data: {
        clubId: jdmLegends.id,
        authorId: sarah.id,
        content:
          "Just got back from the JCCS show at the Queen Mary. AE86 turnout was unreal this year — at least 30 hachirokus in one place. The nostalgia hit different. Who else was there?",
        photos: [],
        createdAt: daysAgo(25),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: jdmLegends.id,
        authorId: mike.id,
        content:
          "Hot take thread: best JDM engine of all time. My vote goes to the 2JZ-GTE purely for longevity and tunability — but the RB26 is right there. SR20DET and 4G63 guys, make your case.",
        photos: [],
        createdAt: daysAgo(18),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: jdmLegends.id,
        authorId: priya.id,
        content:
          "EJ257 appreciation post. Everyone sleeps on the Subaru flat-four but this engine has been making 400+ whp reliably for 20 years. Boxer rumble is unmatched.",
        photos: [],
        createdAt: daysAgo(10),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: jdmLegends.id,
        authorId: carlos.id,
        content:
          "Even as a domestic guy I have to respect the R34 GT-R. Saw a midnight purple V-spec at the Pomona swap meet — absolutely timeless car. One day I will own one.",
        photos: [],
        createdAt: daysAgo(5),
      },
    }),

    // PNW Euro Collective
    prisma.clubPost.create({
      data: {
        clubId: pnwEuro.id,
        authorId: priya.id,
        content:
          "Planning the annual Alpine Run for September. Tentative route: Snoqualmie Pass to Leavenworth, lunch stop, return via Blewett Pass. Limited to 30 cars. Comment to get on the waitlist.",
        photos: [],
        createdAt: daysAgo(40),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: pnwEuro.id,
        authorId: sarah.id,
        content:
          "Just wrapped an Autobahn Country Club track day in my friend's E46 M3. The S54 at 8200 RPM is one of the greatest mechanical symphonies ever recorded. BMW did not miss with that engine.",
        photos: [],
        createdAt: daysAgo(22),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: pnwEuro.id,
        authorId: carlos.id,
        content:
          "Porsche 997 GT3 just posted at a local dealer for $89k. For a naturally aspirated 415hp flat-six that revs to 8400 RPM that's genuinely cheap in 2026. Someone should buy it (not me, I'm a Ford guy).",
        photos: [],
        createdAt: daysAgo(8),
      },
    }),

    // Boosted Daily Drivers
    prisma.clubPost.create({
      data: {
        clubId: boostedDaily.id,
        authorId: mike.id,
        content:
          "Daily boost pressure check-in: what are you running on the street vs. track? I keep the Supra at 18psi street, 22psi track. The tune handles the switchover automatically on E85 flex.",
        photos: [],
        createdAt: daysAgo(35),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: boostedDaily.id,
        authorId: priya.id,
        content:
          "STI made it to 120k miles on Stage 2+ tune. No major issues — just clutch at 95k, plugs every 15k, and an EBCS solenoid at 110k. Turbo Subaru reliability is real if you maintain them.",
        photos: [],
        createdAt: daysAgo(20),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: boostedDaily.id,
        authorId: sarah.id,
        content:
          "Intercooler spray kits — worth it or gimmick? Running Aquamist on the S13 and my intake temps are 20°F lower at peak boost. Seems legit for the $300 cost.",
        photos: [],
        createdAt: daysAgo(12),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: boostedDaily.id,
        authorId: jake.id,
        content:
          "Technically the LS1 in the Miata is naturally aspirated but I'm here for the philosophy. V8 torque at 2000 RPM is its own kind of forced induction.",
        photos: [],
        createdAt: daysAgo(6),
      },
    }),

    // Track Day Regulars
    prisma.clubPost.create({
      data: {
        clubId: trackRegulars.id,
        authorId: priya.id,
        content:
          "Buttonwillow May 24th group buy: if we get 20 people registered through the club we get $50 off per driver. Currently at 14. Tag anyone who might want in.",
        photos: [],
        createdAt: daysAgo(30),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: trackRegulars.id,
        authorId: mike.id,
        content:
          "Data logging setup recommendation: AiM Solo 2 DL is the best bang-for-buck standalone logger. GPS, predictive lap, video overlay. Worth every penny if you're serious about improving lap times.",
        photos: [],
        createdAt: daysAgo(15),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: trackRegulars.id,
        authorId: sarah.id,
        content:
          "Reminder to everyone: Chuckwalla Valley Raceway is offering a night session July 12th. Desert in the dark, 95°F temps drop to 75°F by 8PM. The track is a different animal at night.",
        photos: [],
        createdAt: daysAgo(7),
      },
    }),

    // Classic Muscle Garage
    prisma.clubPost.create({
      data: {
        clubId: classicMuscle.id,
        authorId: carlos.id,
        content:
          "1969 Camaro Z/28 just sold at Barrett-Jackson for $180k. The market for unmolested first-gens is only going up. If you have one, hold it. These cars are generational.",
        photos: [],
        createdAt: daysAgo(28),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: classicMuscle.id,
        authorId: jake.id,
        content:
          "Pro-touring build question: Wilwood or Baer for a '67 Mustang fastback? Planning 4-wheel disc conversion and want something track-capable. Budget is around $3k for brakes.",
        photos: [],
        createdAt: daysAgo(14),
      },
    }),
    prisma.clubPost.create({
      data: {
        clubId: classicMuscle.id,
        authorId: mike.id,
        content:
          "Barn find alert — spotted a covered '71 Chevelle SS in a rural auction listing. 454 still in it, VIN matching. Bidding starts at $22k. Someone in the PNW should go look at it.",
        photos: [],
        createdAt: daysAgo(3),
      },
    }),
  ]);

  console.log(`ClubPosts created: ${clubPosts.length}`);

  // ------------------------------------------------------------------
  // MarketplaceListings
  // ------------------------------------------------------------------
  const listings = await Promise.all([
    prisma.marketplaceListing.create({
      data: {
        sellerId: mike.id,
        title: "Garrett GT35R Turbo — pulled for upgrade",
        description:
          "Pulled from my Supra after upgrading to a larger unit. ~8k miles on it, no shaft play, compressor and turbine wheels are clean. Comes with oil feed/return lines. Great mid-frame turbo for a 2JZ or 1JZ build.",
        price: 1800,
        condition: "GOOD",
        status: "ACTIVE",
        category: "forced_induction",
        photos: [],
        location: "Anaheim, CA",
        carMake: "Toyota",
        carModel: "Supra",
        carYear: 2020,
        createdAt: daysAgo(14),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: sarah.id,
        title: "KA24DE complete engine with harness — S13/S14",
        description:
          "Complete KA24DE pulled from my S14 donor car. 98k miles, compression tested 180PSI all 4 cylinders. Comes with wiring harness, ECU, and intake manifold. Perfect for a budget build or spares.",
        price: 650,
        condition: "GOOD",
        status: "ACTIVE",
        category: "engine_drivetrain",
        photos: [],
        location: "Riverside, CA",
        carMake: "Nissan",
        carModel: "240SX",
        carYear: 1994,
        createdAt: daysAgo(21),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: carlos.id,
        title: "Michelin Pilot Sport Cup 2 305/30/20 — 2 tires, half life",
        description:
          "Two rear tires pulled from the GT500. Half tread life remaining, no cuts or repairs. These are $450 each new — selling both for $350. Pick up Costa Mesa.",
        price: 350,
        condition: "GOOD",
        status: "ACTIVE",
        category: "wheels_tires",
        photos: [],
        location: "Costa Mesa, CA",
        createdAt: daysAgo(7),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: jake.id,
        title: "Sikky LS Miata Motor Mount Kit — NB chassis",
        description:
          "Used Sikky Manufacturing LS swap kit for NB Miata. Includes motor mounts, transmission crossmember, and LS oil pan. Pulled when I upgraded to custom mounts. All hardware included.",
        price: 480,
        condition: "GOOD",
        status: "ACTIVE",
        category: "engine_drivetrain",
        photos: [],
        location: "Fontana, CA",
        carMake: "Mazda",
        carModel: "Miata",
        carYear: 1999,
        createdAt: daysAgo(10),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: priya.id,
        title: "COBB AccessPort V3 — Subaru FA/EJ (flashed off)",
        description:
          "COBB AP3 for Subaru EJ/FA engines. Flashed off my STI, ready for new owner. Comes with OEM cable and box. Compatible with 2008–2021 WRX STI and many WRX models. Check COBB compatibility chart.",
        price: 420,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        category: "electronics",
        photos: [],
        location: "Seattle, WA",
        createdAt: daysAgo(5),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: mike.id,
        title: "Wagner Tuning Intercooler — A90 Supra B58",
        description:
          "Wagner Tuning bar-and-plate intercooler for A90 Supra. Bought a larger custom unit so this is surplus. Only 6 months of use. Comes with all OEM charge pipe connections and brackets.",
        price: 780,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        category: "forced_induction",
        photos: [],
        location: "Anaheim, CA",
        carMake: "Toyota",
        carModel: "Supra",
        carYear: 2020,
        createdAt: daysAgo(3),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: sarah.id,
        title: "Stance XA Coilovers — 240SX fitment (sold, posting for reference)",
        description:
          "Previously used on my S13. 32-way adjustable, height adjustable. These are sold but leaving up for price reference. ~18k miles on them, no leaks.",
        price: 750,
        condition: "GOOD",
        status: "SOLD",
        category: "suspension",
        photos: [],
        location: "Riverside, CA",
        carMake: "Nissan",
        carModel: "240SX",
        carYear: 1995,
        createdAt: daysAgo(45),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: carlos.id,
        title: "Borla ATAK Catback — S550 Mustang GT",
        description:
          "Borla ATAK system for 2018-2023 Mustang GT. Aggressive tone inside and out — not for people who like stealth. 3-inch tubing, stainless tips. Selling because I upgraded to full long-tube setup.",
        price: 860,
        condition: "GOOD",
        status: "ACTIVE",
        category: "exhaust",
        photos: [],
        location: "Costa Mesa, CA",
        carMake: "Ford",
        carModel: "Mustang",
        carYear: 2022,
        createdAt: daysAgo(18),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: jake.id,
        title: "Haltech Elite 2500 ECU — lightly used, full harness",
        description:
          "Haltech Elite 2500 with full expansion harness. Was running the LS1 Miata, pulled to upgrade to the Nexus R5. Includes wideband O2 sensor, boost control solenoid, and MAP sensor. Will need pinout for your application.",
        price: 1900,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        category: "electronics",
        photos: [],
        location: "Fontana, CA",
        createdAt: daysAgo(8),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: priya.id,
        title: "Whiteline Rear Sway Bar Kit — Subaru BRZ/GR86/FRS",
        description:
          "Whiteline 24mm adjustable rear sway bar for BRZ/GR86/FRS platform. Pulled from my BRZ when I went to a beefier aftermarket piece. 3-way adjustable. Includes end links and all hardware.",
        price: 220,
        condition: "GOOD",
        status: "ACTIVE",
        category: "suspension",
        photos: [],
        location: "Seattle, WA",
        carMake: "Subaru",
        carModel: "BRZ",
        carYear: 2019,
        createdAt: daysAgo(12),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: mike.id,
        title: "Brembo Sport Cross-Drilled Rotors — Supra front",
        description:
          "Brembo Sport cross-drilled rotors for A90 Supra front. Used for 10k miles, no cracking. Selling because I went to full Brembo GT kit. Still plenty of meat left.",
        price: 290,
        condition: "FAIR",
        status: "ACTIVE",
        category: "brakes",
        photos: [],
        location: "Anaheim, CA",
        createdAt: daysAgo(6),
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: carlos.id,
        title: "ZL1 Track Pack Wheels — 20x10 front, 20x11 rear (set of 4)",
        description:
          "Factory Camaro ZL1 1LE forged aluminum wheels. Pulled for wider aftermarket rubber. No curb rash, tires are stripped. Selling as set — $1,400 or separate by axle.",
        price: 1400,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        category: "wheels_tires",
        photos: [],
        location: "Costa Mesa, CA",
        carMake: "Chevrolet",
        carModel: "Camaro",
        carYear: 2018,
        createdAt: daysAgo(2),
      },
    }),
  ]);

  console.log(`MarketplaceListings created: ${listings.length}`);

  // ------------------------------------------------------------------
  // Conversations + Messages (mike is "user 0", must be participant)
  // ------------------------------------------------------------------
  const minutesAgo = (n: number) => new Date(Date.now() - n * 60 * 1000);

  const [convMikeSarah, convMikeCarlos, convMikePriya, convMikeJake, convSarahPriya] =
    await Promise.all([
      prisma.conversation.create({ data: { user1Id: mike.id, user2Id: sarah.id } }),
      prisma.conversation.create({ data: { user1Id: mike.id, user2Id: carlos.id } }),
      prisma.conversation.create({ data: { user1Id: mike.id, user2Id: priya.id } }),
      prisma.conversation.create({ data: { user1Id: mike.id, user2Id: jake.id } }),
      prisma.conversation.create({ data: { user1Id: sarah.id, user2Id: priya.id } }),
    ]);

  await Promise.all([
    // Mike <-> Sarah — drift talk
    prisma.message.create({
      data: {
        conversationId: convMikeSarah.id,
        senderId: sarah.id,
        receiverId: mike.id,
        content: "Yo did you see the angle kit video I posted? New max lock is insane.",
        read: true,
        createdAt: minutesAgo(180),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeSarah.id,
        senderId: mike.id,
        receiverId: sarah.id,
        content: "Yeah!! That transition at 0:32 made me nervous just watching it. How does it feel?",
        read: true,
        createdAt: minutesAgo(175),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeSarah.id,
        senderId: sarah.id,
        receiverId: mike.id,
        content: "Honestly it's super confidence inspiring once you get used to it. First lap I was fighting it, by lap 5 it clicked.",
        read: true,
        createdAt: minutesAgo(170),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeSarah.id,
        senderId: mike.id,
        receiverId: sarah.id,
        content: "You bringing the S13 to the Pomona meet next month?",
        read: true,
        createdAt: minutesAgo(165),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeSarah.id,
        senderId: sarah.id,
        receiverId: mike.id,
        content: "100%. Also thinking about bringing the S14 project so people can see the progress.",
        read: false, // unread for mike
        createdAt: minutesAgo(30),
      },
    }),

    // Mike <-> Carlos — power wars
    prisma.message.create({
      data: {
        conversationId: convMikeCarlos.id,
        senderId: carlos.id,
        receiverId: mike.id,
        content: "Bro when the Supra hits 600whp you have to race me. GT500 vs Supra at the dragstrip.",
        read: true,
        createdAt: minutesAgo(300),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeCarlos.id,
        senderId: mike.id,
        receiverId: carlos.id,
        content: "You better bring sticky tires. The Supra launches like a compressed spring.",
        read: true,
        createdAt: minutesAgo(295),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeCarlos.id,
        senderId: carlos.id,
        receiverId: mike.id,
        content: "820whp on drag radials. Your turbo four won't see which way I went 😂",
        read: true,
        createdAt: minutesAgo(290),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeCarlos.id,
        senderId: mike.id,
        receiverId: carlos.id,
        content: "You're on. Auto Club Speedway, June. Let's make it happen.",
        read: true,
        createdAt: minutesAgo(280),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeCarlos.id,
        senderId: carlos.id,
        receiverId: mike.id,
        content: "Done. I'm already looking forward to watching that intercooler spray.",
        read: false, // unread for mike
        createdAt: minutesAgo(45),
      },
    }),

    // Mike <-> Priya — track day coordination
    prisma.message.create({
      data: {
        conversationId: convMikePriya.id,
        senderId: priya.id,
        receiverId: mike.id,
        content: "Buttonwillow May 24th — you in? Trying to confirm headcount for the group rate.",
        read: true,
        createdAt: minutesAgo(500),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikePriya.id,
        senderId: mike.id,
        receiverId: priya.id,
        content: "I'm in. Intermediate run group. Should I bring the Supra or the Evo? Evo is probably more fun at Buttonwillow.",
        read: true,
        createdAt: minutesAgo(490),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikePriya.id,
        senderId: priya.id,
        receiverId: mike.id,
        content: "Bring the Evo. Buttonwillow rewards AWD traction on the sweepers.",
        read: true,
        createdAt: minutesAgo(480),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikePriya.id,
        senderId: priya.id,
        receiverId: mike.id,
        content: "Also heads up: I'm sharing a pit space. You're welcome to stack in if you want to save on the space fee.",
        read: false, // unread for mike
        createdAt: minutesAgo(60),
      },
    }),

    // Mike <-> Jake — LS swap consultation
    prisma.message.create({
      data: {
        conversationId: convMikeJake.id,
        senderId: mike.id,
        receiverId: jake.id,
        content: "Real talk — how hard is the LS swap in the Miata for someone with a home garage and a lift?",
        read: true,
        createdAt: minutesAgo(700),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeJake.id,
        senderId: jake.id,
        receiverId: mike.id,
        content: "If you use the Sikky kit it's very manageable. Main headaches are the driveshaft length and the wiring. Budget 3 weekends.",
        read: true,
        createdAt: minutesAgo(695),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeJake.id,
        senderId: mike.id,
        receiverId: jake.id,
        content: "What ECU are you recommending? I was thinking Haltech.",
        read: true,
        createdAt: minutesAgo(690),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeJake.id,
        senderId: jake.id,
        receiverId: mike.id,
        content: "Haltech Elite 2500 is what I ran. Overkill for a street build but I love the data logging. HP Tuners is cheaper if you want to keep it simple.",
        read: true,
        createdAt: minutesAgo(685),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convMikeJake.id,
        senderId: jake.id,
        receiverId: mike.id,
        content: "Actually I have an Elite 2500 listed on the marketplace now — just posted it. Take a look if you want it.",
        read: false, // unread for mike
        createdAt: minutesAgo(20),
      },
    }),

    // Sarah <-> Priya — not involving mike, but good content
    prisma.message.create({
      data: {
        conversationId: convSarahPriya.id,
        senderId: priya.id,
        receiverId: sarah.id,
        content: "Your drift session at Irwindale looked incredible. How long did it take you to get comfortable with the new angle kit?",
        read: true,
        createdAt: minutesAgo(400),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convSarahPriya.id,
        senderId: sarah.id,
        receiverId: priya.id,
        content: "Honestly about 4 sessions. The first day I was just white-knuckling it. Now it feels natural.",
        read: true,
        createdAt: minutesAgo(395),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convSarahPriya.id,
        senderId: priya.id,
        receiverId: sarah.id,
        content: "Goals. I want to try a drift day sometime — any beginner-friendly events coming up?",
        read: true,
        createdAt: minutesAgo(390),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: convSarahPriya.id,
        senderId: sarah.id,
        receiverId: priya.id,
        content: "Irwindale does beginner days on Tuesday nights. You can rent a drift taxi too if you want to feel it first. DM me and I'll connect you with the organizer.",
        read: true,
        createdAt: minutesAgo(385),
      },
    }),
  ]);

  console.log("Conversations and Messages created.");

  // ------------------------------------------------------------------
  // Notifications for mike (user 0)
  // ------------------------------------------------------------------
  const [
    buildPost1,
    buildPost2,
    _buildPost3,
    _buildPost4,
    _buildPost5,
    _buildPost6,
  ] = buildUpdatePosts;

  const notifications = await Promise.all([
    // LIKEs on mike's posts
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: sarah.id,
        type: "LIKE",
        read: false,
        postId: buildPost1.id,
        createdAt: daysAgo(2),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: carlos.id,
        type: "LIKE",
        read: false,
        postId: buildPost1.id,
        createdAt: daysAgo(2),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: jake.id,
        type: "LIKE",
        read: true,
        postId: buildPost2.id,
        createdAt: daysAgo(5),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: priya.id,
        type: "LIKE",
        read: true,
        postId: buildPost2.id,
        createdAt: daysAgo(5),
      },
    }),
    // COMMENTs on mike's posts
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: sarah.id,
        type: "COMMENT",
        read: false,
        postId: buildPost1.id,
        createdAt: daysAgo(1),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: jake.id,
        type: "COMMENT",
        read: false,
        postId: buildPost1.id,
        createdAt: minutesAgo(90),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: carlos.id,
        type: "COMMENT",
        read: true,
        postId: buildPost2.id,
        createdAt: daysAgo(4),
      },
    }),
    // FOLLOWs
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: priya.id,
        type: "FOLLOW",
        read: false,
        createdAt: daysAgo(3),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: carlos.id,
        type: "FOLLOW",
        read: true,
        createdAt: daysAgo(10),
      },
    }),
    // RSVPs to mike's event
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: sarah.id,
        type: "RSVP",
        read: false,
        eventId: socalMeet.id,
        createdAt: daysAgo(1),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: jake.id,
        type: "RSVP",
        read: false,
        eventId: socalMeet.id,
        createdAt: minutesAgo(240),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: priya.id,
        type: "RSVP",
        read: true,
        eventId: socalMeet.id,
        createdAt: daysAgo(6),
      },
    }),
    // CLUB_INVITE — someone invited mike to a club
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: jake.id,
        type: "CLUB_INVITE",
        read: false,
        clubId: airClub.id,
        createdAt: daysAgo(2),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: carlos.id,
        type: "CLUB_INVITE",
        read: false,
        clubId: classicMuscle.id,
        createdAt: minutesAgo(120),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mike.id,
        actorId: priya.id,
        type: "CLUB_INVITE",
        read: true,
        clubId: trackRegulars.id,
        createdAt: daysAgo(8),
      },
    }),
  ]);

  console.log(`Notifications created: ${notifications.length}`);

  console.log("\nSeeding complete!");
  console.log(`  Users:                5`);
  console.log(`  Cars:                 10`);
  console.log(`  Posts (all types):    ${posts.length + buildUpdatePosts.length}`);
  console.log(`    - BUILD_UPDATE:     ${buildUpdatePosts.length}`);
  console.log(`  BuildUpdate rows:     ${buildUpdates.length}`);
  console.log(`  CarMod rows:          ${carMods.length}`);
  console.log(`  CarClubs:             6`);
  console.log(`  ClubMemberships:      ${membershipData.length}`);
  console.log(`  ClubPosts:            ${clubPosts.length}`);
  console.log(`  MarketplaceListings:  ${listings.length}`);
  console.log(`  Conversations:        5`);
  console.log(`  Messages:             ${/* 5+5+4+5+4 = */ 23}`);
  console.log(`  Notifications:        ${notifications.length}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
